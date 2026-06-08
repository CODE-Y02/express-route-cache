import type { Request, Response, NextFunction } from "express";
import type {
  CacheClient,
  CacheConfig,
  CacheEntry,
  CacheInstance,
  RouteOptions,
  CacheMetrics,
} from "./types";
import {
  buildCacheKey,
  serializeEntry,
  deserializeEntry,
  getFreshness,
  getAgeSeconds,
  getParentRoutePatterns,
  getEpochKey,
  getRoutePattern,
} from "./utils";
import { LRUCache } from "lru-cache";

interface SWRRequest extends Request {
  __is_swr?: boolean;
  __swr_cache_key?: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULTS = {
  staleTime: 60,
  gcTime: 300,
  swr: false,
  stampede: true,
  keyPrefix: "erc:",
  vary: [] as string[],
  enabled: true,
  maxBodySize: 2097152, // 2MB
  autoInvalidate: false,
  retry: 0,
} as const;

// ─── Stampede Lock ──────────────────────────────────────────────────────────

/**
 * In-memory lock map for stampede protection.
 * Key = cache key, Value = in-flight Promise of the data/response.
 * Ensures that if 1,000 requests hit a cold cache simultaneously,
 * only 1 handler executes while the others wait for the result.
 *
 * ⚠️ This is process-local. In distributed deployments (multiple servers),
 * each server has its own map. For cross-server stampede protection during
 * initial cache MISS, a distributed adapter (Redis/Memcached) is required.
 */
const inflightRequests = new LRUCache<string, Promise<unknown>>({
  max: 5000, // Maximum pending locks to prevent memory leaks from massive unique key attacks
});

/**
 * Per-process SWR revalidation lock.
 * Used as a fallback when the cache adapter does not implement `setNX`.
 * Prevents the same process from firing multiple concurrent background
 * revalidations for the same cache key.
 *
 * In distributed deployments, adapters with `setNX` (Redis, Memcached)
 * provide cluster-wide SWR locking, making this Set redundant for those adapters.
 */
const localSwrLocks = new Set<string>();

// ─── createCache ────────────────────────────────────────────────────────────

/**
 * Create a cache instance with the given configuration.
 * Returns an object with `.middleware()`, `.route()`, `.invalidate()`, and `.invalidateRoute()`.
 *
 * @example
 * ```ts
 * const cache = createCache({
 *   adapter: createMemoryAdapter(),
 *   staleTime: 60,
 *   gcTime: 300,
 *   swr: true,
 * });
 *
 * app.use(cache.middleware());
 * router.get('/users/:id', cache.route({ staleTime: 120 }), getUser);
 * router.post('/users', cache.invalidate('/users'), createUser);
 * ```
 */
export function createCache(config: CacheConfig): CacheInstance {
  const globalOpts = {
    staleTime: config.staleTime ?? DEFAULTS.staleTime,
    gcTime: config.gcTime ?? DEFAULTS.gcTime,
    swr: config.swr ?? DEFAULTS.swr,
    stampede: config.stampede ?? DEFAULTS.stampede,
    keyPrefix: config.keyPrefix ?? DEFAULTS.keyPrefix,
    vary: config.vary ?? DEFAULTS.vary,
    enabled: config.enabled ?? DEFAULTS.enabled,
    sortQuery: config.sortQuery ?? false,
    maxBodySize: config.maxBodySize ?? DEFAULTS.maxBodySize,
    autoInvalidate: config.autoInvalidate ?? DEFAULTS.autoInvalidate,
    retry: config.retry ?? DEFAULTS.retry,
  };

  const metrics = config.metrics
    ? {
        hits: 0,
        misses: 0,
        swrHits: 0,
        swrFailures: 0,
        stampedeCoalesces: 0,
        stampedePolls: 0,
      }
    : undefined;

  const client = config.adapter;

  // ── Shared cache logic ──────────────────────────────────────────────

  function createCacheHandler(routeOpts?: RouteOptions) {
    const handler = async function cacheHandler(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      // Bypass cache read for background SWR revalidation requests
      if ((req as SWRRequest).__is_swr) {
        const staleTime = routeOpts?.staleTime ?? globalOpts.staleTime;
        const gcTime = routeOpts?.gcTime ?? globalOpts.gcTime;
        const maxBodySize = routeOpts?.maxBodySize ?? globalOpts.maxBodySize;
        const totalTTL = staleTime + gcTime;
        const cacheKey = (req as SWRRequest).__swr_cache_key || "";

        interceptResponse(
          req,
          res,
          next,
          client,
          cacheKey,
          totalTTL,
          staleTime,
          maxBodySize,
        ).catch(() => {
          /* Fail silently */
        });
        return;
      }

      const enabledCheck = routeOpts?.enabled ?? globalOpts.enabled;
      const enabled =
        typeof enabledCheck === "function"
          ? enabledCheck(req, res)
          : enabledCheck;

      // Handle auto-invalidation and routing for non-GET mutation methods
      if (req.method !== "GET") {
        const autoInv = routeOpts?.autoInvalidate ?? globalOpts.autoInvalidate;
        if (autoInv) {
          res.on("finish", async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const pattern = routeOpts?.key ? null : getRoutePattern(req);
              if (pattern) {
                await invalidateRoutes([pattern]);
              }
            }
          });
        }

        // Non-GET caching must be explicitly enabled per-route (not via global default enabled = true)
        const isExplicitlyEnabled = routeOpts?.enabled !== undefined && enabled;
        if (!isExplicitlyEnabled) {
          next();
          return;
        }
      }

      // Check enabled
      if (!enabled) {
        next();
        return;
      }

      const staleTime = routeOpts?.staleTime ?? globalOpts.staleTime;
      const gcTime = routeOpts?.gcTime ?? globalOpts.gcTime;
      const swr = routeOpts?.swr ?? globalOpts.swr;
      const vary = routeOpts?.vary ?? globalOpts.vary;
      const sortQuery = routeOpts?.sortQuery ?? globalOpts.sortQuery;
      const maxBodySize = routeOpts?.maxBodySize ?? globalOpts.maxBodySize;
      const totalTTL = staleTime + gcTime;

      try {
        // Build the versioned cache key (includes epochs for O(1) invalidation)
        let cacheKey: string;

        if (routeOpts?.key) {
          // Custom key override
          cacheKey =
            typeof routeOpts.key === "function"
              ? routeOpts.key(req)
              : routeOpts.key;
          cacheKey = `${globalOpts.keyPrefix}${cacheKey}`;
        } else {
          // We need req.route to be populated — this happens AFTER route matching.
          // If called as global middleware before route matching, use req.path as fallback.
          const result = await buildCacheKey(
            client,
            req,
            globalOpts.keyPrefix,
            vary,
            sortQuery,
          );
          cacheKey = result.key;
        }

        // ── Try cache read ────────────────────────────────────────────
        const cached = await client.get(cacheKey);

        if (cached) {
          const entry = deserializeEntry(cached);
          if (entry) {
            const freshness = getFreshness(entry, staleTime, gcTime);
            const age = getAgeSeconds(entry);

            if (freshness === "fresh") {
              // ⚡ Fresh HIT — serve immediately
              if (metrics) metrics.hits++;
              sendCachedResponse(res, entry, age, staleTime, "HIT");
              return;
            }

            if (freshness === "stale" && swr) {
              // 🔄 Stale + SWR — serve stale, revalidate in background
              if (metrics) metrics.swrHits++;
              sendCachedResponse(res, entry, age, staleTime, "STALE");

              // ── Two-tier SWR Lock ────────────────────────────────────
              // Tier 1: Distributed lock via adapter setNX (Redis/Memcached).
              //         Prevents multiple servers from revalidating the same key.
              // Tier 2: Local in-process Set fallback for adapters without setNX.
              //         Prevents the same server from double-firing per process.
              let acquired: boolean;

              if (client.setNX) {
                // Distributed lock — adapter handles cross-server coordination
                const lockTime = Math.max(10, staleTime);
                acquired = await client.setNX(
                  `swr-lock:${cacheKey}`,
                  "1",
                  lockTime,
                );
              } else {
                // Local fallback — per-process lock only
                acquired = !localSwrLocks.has(cacheKey);
                if (acquired) {
                  localSwrLocks.add(cacheKey);
                }
              }

              if (acquired) {
                // Background revalidation (fire-and-forget)
                revalidateInBackground(
                  client,
                  cacheKey,
                  req,
                  res,
                  next,
                  totalTTL,
                  staleTime,
                  maxBodySize,
                  metrics,
                ).finally(() => {
                  // Release local lock when done (adapter lock expires via TTL)
                  localSwrLocks.delete(cacheKey);
                });
              }
              return;
            }

            // Stale + no SWR, or expired → fall through to MISS
          }
        }

        // ── Cache MISS ────────────────────────────────────────────────

        // ── Tier 1: Distributed Stampede Protection ──────────────────
        // If the adapter supports setNX, use it to elect one server as
        // the leader. All other servers poll the cache until the leader
        // populates it, preventing N simultaneous DB queries.
        if (client.setNX && !inflightRequests.has(cacheKey)) {
          const stampedeLockKey = `stampede:${cacheKey}`;
          const isLeader = await client.setNX(
            stampedeLockKey,
            "1",
            totalTTL + 30,
          );

          if (!isLeader) {
            // Another server holds the lock — poll the cache and serve when ready
            await waitForCachePopulation(
              client,
              cacheKey,
              res,
              staleTime,
              next,
              metrics,
            );
            return;
          }

          // We are the leader — run the handler and release lock when done
          if (metrics) metrics.misses++;
          const entryPromise = interceptResponse(
            req,
            res,
            next,
            client,
            cacheKey,
            totalTTL,
            staleTime,
            maxBodySize,
          );

          // Also register in local LRU so same-process concurrent requests coalesce
          if (globalOpts.stampede) {
            inflightRequests.set(cacheKey, entryPromise);
          }
          entryPromise.finally(() => {
            inflightRequests.delete(cacheKey);
            // Release the distributed lock so followers can proceed if polling timed out
            client.del(stampedeLockKey).catch(() => {});
          });
          return;
        }

        // ── Tier 2: Local Stampede Protection (no distributed adapter) ──
        // Coalesce same-process concurrent requests into a single in-flight
        // Promise. Works per-server only.
        if (globalOpts.stampede && inflightRequests.has(cacheKey)) {
          const entry = (await inflightRequests.get(
            cacheKey,
          )) as CacheEntry | null;
          if (entry) {
            const age = getAgeSeconds(entry);
            if (metrics) metrics.stampedeCoalesces++;
            sendCachedResponse(res, entry, age, staleTime, "HIT");
            return;
          }
          // entry is null (non-2xx) — fall through to re-execute
        }

        // Intercept res.json / res.send to capture the response
        if (metrics) metrics.misses++;
        const entryPromise = interceptResponse(
          req,
          res,
          next,
          client,
          cacheKey,
          totalTTL,
          staleTime,
          maxBodySize,
        );

        if (globalOpts.stampede) {
          inflightRequests.set(cacheKey, entryPromise);
          entryPromise.finally(() => {
            inflightRequests.delete(cacheKey);
          });
        }
      } catch {
        // Cache failure should never break the app — pass through
        next();
      }
    };
    Object.defineProperty(handler, "isCacheMiddleware", { value: true });
    return handler;
  }

  // ── Invalidation ────────────────────────────────────────────────────

  async function invalidateRoutes(routePatterns: string[]): Promise<void> {
    for (const pattern of routePatterns) {
      const epochKey = getEpochKey(pattern);
      await client.incr(epochKey);
    }
  }

  // ── Return the CacheInstance ────────────────────────────────────────

  const instance: CacheInstance = {
    middleware: () => createCacheHandler(),
    route: (opts?: RouteOptions) => createCacheHandler(opts),
    invalidate: (...routePatterns: string[]) => {
      return (req: Request, res: Response, next: NextFunction) => {
        res.on("finish", async () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              await invalidateRoutes(routePatterns);
            } catch {
              // Don't block
            }
          }
        });
        next();
      };
    },
    invalidateRoute: (...routePatterns: string[]) =>
      invalidateRoutes(routePatterns),
    /**
     * Standalone data fetching with built-in SWR and Stampede Protection.
     * Use this for manual data caching (e.g., Database calls, External APIs).
     *
     * @example
     * const users = await cache.fetch('all-users', () => db.users.findMany(), {
     *   staleTime: 60,
     *   swr: true,
     *   retry: 3
     * });
     *
     * @template T - The type of data being fetched.
     * @param key - Unique cache identifier.
     * @param fetcher - Async function to retrieve data on MISS or SWR revalidation.
     * @param opts - Overrides for staleTime, gcTime, retry count, and SWR toggle.
     * @returns The cached or freshly fetched data.
     */
    fetch: async <T>(
      key: string,
      fetcher: () => Promise<T>,
      opts?: Omit<
        RouteOptions,
        "key" | "autoInvalidate" | "vary" | "sortQuery"
      >,
    ): Promise<T> => {
      const staleTime = opts?.staleTime ?? globalOpts.staleTime;
      const gcTime = opts?.gcTime ?? globalOpts.gcTime;
      const swr = opts?.swr ?? globalOpts.swr;
      const retryCount = opts?.retry ?? globalOpts.retry;
      const totalTTL = staleTime + gcTime;
      const cacheKey = key.startsWith(globalOpts.keyPrefix)
        ? key
        : `${globalOpts.keyPrefix}${key}`;

      // ── Try cache read ────────────────────────────────────────────
      const cached = await client.get(cacheKey);
      if (cached) {
        try {
          const entry = JSON.parse(cached);
          if (entry && typeof entry.createdAt === "number") {
            const ageSeconds = (Date.now() - entry.createdAt) / 1000;
            const parsedData = entry.isBuffer
              ? Buffer.from(entry.data, "base64")
              : (entry.data ?? entry.body);
            if (ageSeconds < staleTime) {
              if (metrics) metrics.hits++;
              return parsedData as T;
            }
            if (ageSeconds < totalTTL && swr) {
              if (metrics) metrics.swrHits++;
              // 🔄 Stale + SWR — serve stale, revalidate in background
              executeFetcherWithRetry(fetcher, retryCount)
                .then(async (data) => {
                  const isBuffer = Buffer.isBuffer(data);
                  const payload = {
                    data: isBuffer ? (data as Buffer).toString("base64") : data,
                    isBuffer,
                    createdAt: Date.now(),
                  };
                  await client.set(cacheKey, JSON.stringify(payload), totalTTL);
                })
                .catch(() => {
                  if (metrics) metrics.swrFailures++;
                  /* Background fail stays silent */
                });
              return parsedData as T;
            }
          }
        } catch {
          /* Fall through to MISS */
        }
      }

      // ── Cache MISS ────────────────────────────────────────────────
      if (globalOpts.stampede && inflightRequests.has(cacheKey)) {
        if (metrics) metrics.stampedeCoalesces++;
        return (await inflightRequests.get(cacheKey)) as T;
      }

      if (metrics) metrics.misses++;
      const promise = executeFetcherWithRetry(fetcher, retryCount).then(
        async (data) => {
          const isBuffer = Buffer.isBuffer(data);
          const payload = {
            data: isBuffer ? (data as Buffer).toString("base64") : data,
            isBuffer,
            createdAt: Date.now(),
          };
          await client.set(cacheKey, JSON.stringify(payload), totalTTL);
          return data;
        },
      );

      if (globalOpts.stampede) {
        inflightRequests.set(cacheKey, promise);
        promise.finally(() => inflightRequests.delete(cacheKey));
      }

      return await promise;
    },
    adapter: client,
    metrics,
    studio: config.studio,
  };

  // ── Auto-start Cache Studio Standalone Server if port is specified ──
  const studioOpts = config.studio === true ? {} : config.studio;
  if (
    studioOpts &&
    studioOpts.enabled !== false &&
    typeof studioOpts.port === "number"
  ) {
    const port = studioOpts.port;
    const pathStr = studioOpts.path || "/studio";
    const hostname = studioOpts.hostname || "localhost";

    process.nextTick(() => {
      try {
        const { createStudio } = require("@express-route-cache/studio");
        const express = require("express");
        const app = express();
        app.use(express.json());

        const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
        app.use(cleanPath, createStudio({ cache: instance }));

        app.listen(port, () => {
          console.log(
            `Cache Studio visible at --> http://${hostname}:${port}${cleanPath}`,
          );
        });
      } catch (err) {
        console.error(
          "Failed to auto-start standalone Cache Studio server:",
          err,
        );
      }
    });
  }

  return instance;
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Send a cached response with proper headers.
 */
function sendCachedResponse(
  res: Response,
  entry: CacheEntry,
  ageSeconds: number,
  staleTime: number,
  cacheStatus: "HIT" | "STALE",
): void {
  res.status(entry.statusCode);

  // Replay stored headers
  for (const [key, value] of Object.entries(entry.headers)) {
    res.setHeader(key, value);
  }

  // Add cache-specific headers
  res.setHeader("X-Cache", cacheStatus);
  res.setHeader("Age", String(ageSeconds));

  // Only force public Cache-Control if the application hasn't set its own
  if (!res.getHeader("cache-control")) {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${Math.max(0, staleTime - ageSeconds)}`,
    );
  }

  const body = entry.isBase64 ? Buffer.from(entry.body, "base64") : entry.body;
  res.end(body);
}

/**
 * Intercept the response to capture and cache it.
 * Uses a one-shot flag to prevent infinite loops from monkey-patching res.json/res.send.
 */
function interceptResponse(
  req: Request,
  res: Response,
  next: NextFunction,
  client: CacheClient,
  cacheKey: string,
  totalTTL: number,
  staleTime: number,
  maxBodySize: number,
): Promise<CacheEntry | null> {
  return new Promise<CacheEntry | null>((resolve) => {
    // One-shot flag: prevents re-entry from monkey-patching
    let intercepted = false;
    let currentSize = 0;
    let sizeExceeded = false;

    const originalEnd = res.end.bind(res);
    const originalWrite = res.write.bind(res);
    const chunks: Buffer[] = [];

    // Capture client abort/disconnect to release stampede locks
    req.on("close", () => {
      if (!intercepted) {
        intercepted = true;
        resolve(null);
      }
    });

    // Capture writes with encoding support
    res.write = function (chunk: any, encodingOrCb?: any, cb?: any): boolean {
      const encoding =
        typeof encodingOrCb === "string"
          ? (encodingOrCb as BufferEncoding)
          : undefined;
      if (chunk && !sizeExceeded) {
        const buffer = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk, encoding);
        currentSize += buffer.length;
        if (currentSize > maxBodySize) {
          sizeExceeded = true;
          chunks.length = 0; // free memory
        } else {
          chunks.push(buffer);
        }
      }
      return originalWrite(chunk, encodingOrCb, cb);
    } as typeof res.write;

    // Capture end with encoding support
    res.end = function (chunk?: any, encodingOrCb?: any, cb?: any): Response {
      const encoding =
        typeof encodingOrCb === "string"
          ? (encodingOrCb as BufferEncoding)
          : undefined;
      if (intercepted) {
        return originalEnd(chunk, encodingOrCb, cb);
      }
      intercepted = true;

      if (chunk && !sizeExceeded) {
        const buffer = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk, encoding);
        currentSize += buffer.length;
        if (currentSize > maxBodySize) {
          sizeExceeded = true;
          chunks.length = 0; // free memory
        } else {
          chunks.push(buffer);
        }
      }

      if (sizeExceeded) {
        // Fallback: Skip caching to protect memory limits
        resolve(null);
        return originalEnd(chunk, encodingOrCb, cb);
      }

      const bodyBuffer = Buffer.concat(chunks);
      // Store version 2 format (Base64) to handle binary data safely
      const body = bodyBuffer.toString("base64");

      // Only cache successful responses (2xx)
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        const entry: CacheEntry = {
          body,
          statusCode,
          headers: extractCacheableHeaders(res),
          createdAt: Date.now(),
          isBase64: true,
        };

        // Store in cache (fire-and-forget)
        client.set(cacheKey, serializeEntry(entry), totalTTL).catch(() => {
          /* Fail silently */
        });

        // Set cache headers on MISS if they haven't been sent yet
        if (!res.headersSent) {
          res.setHeader("X-Cache", "MISS");
          res.setHeader("Age", "0");
          if (!res.getHeader("cache-control")) {
            res.setHeader("Cache-Control", `public, max-age=${staleTime}`);
          }
        }

        resolve(entry);
      } else {
        // Non-2xx: don't cache
        resolve(null);
      }

      return originalEnd(chunk, encodingOrCb, cb);
    } as typeof res.end;

    next();
  });
}

/**
 * Re-execute the handler in the background for SWR revalidation.
 * This runs the Express middleware chain using a mock response object.
 */
async function revalidateInBackground(
  client: CacheClient,
  cacheKey: string,
  req: Request,
  res: Response,
  next: NextFunction,
  totalTTL: number,
  staleTime: number,
  maxBodySize: number,
  metrics?: CacheMetrics,
): Promise<void> {
  // Safe execution of remaining route stack in background if route metadata is available
  if (req.route && Array.isArray(req.route.stack)) {
    const stack = req.route.stack as {
      handle?: ((req: Request, res: Response, next: NextFunction) => void) & {
        isCacheMiddleware?: boolean;
      };
      handle_request?: (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => void;
    }[];

    let currentIndex = -1;
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (layer && layer.handle && layer.handle.isCacheMiddleware) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex !== -1) {
      // Create a Mock Request object inheriting from the real one
      const mockReq = Object.create(req) as SWRRequest;
      mockReq.__is_swr = true;
      mockReq.__swr_cache_key = cacheKey;
      mockReq.headers = { ...req.headers };
      mockReq.unpipe = () => mockReq;

      // Create a Mock Response object inheriting from the real one but disabling network output
      const mockRes = Object.create(res);
      mockRes.statusCode = 200;
      Object.defineProperty(mockRes, "headersSent", {
        value: false,
        writable: true,
      });
      Object.defineProperty(mockRes, "finished", {
        value: false,
        writable: true,
      });

      // Isolate headers by copying existing ones safely
      const localHeaders = new Map<string, string | string[]>();
      for (const [key, value] of Object.entries(res.getHeaders())) {
        if (value !== undefined) {
          if (typeof value === "number") {
            localHeaders.set(key, String(value));
          } else {
            localHeaders.set(key, value);
          }
        }
      }
      mockRes.setHeader = (name: string, value: string | string[]) => {
        localHeaders.set(name.toLowerCase(), value);
        return mockRes;
      };
      mockRes.getHeader = (name: string) =>
        localHeaders.get(name.toLowerCase());
      mockRes.removeHeader = (name: string) =>
        localHeaders.delete(name.toLowerCase());
      mockRes.getHeaders = () => Object.fromEntries(localHeaders);

      // Note: mockRes.write and mockRes.end are NOT set here — interceptResponse
      // will monkey-patch them to capture the response body for caching.
      // SWR lock cleanup is handled by the .finally() block in the caller.

      // Set up the response interceptor for this mock request/response first!
      interceptResponse(
        mockReq,
        mockRes as Response,
        () => {}, // no-op next
        client,
        cacheKey,
        totalTTL,
        staleTime,
        maxBodySize,
      ).catch(() => {});

      // Run the remaining layers in the route stack
      let index = currentIndex + 1;
      const runNext = (err?: unknown) => {
        if (err) {
          console.error(
            "[@express-route-cache] SWR background revalidation failed. Check your route handler for errors.",
          );
          if (metrics) metrics.swrFailures++;
          return;
        }
        if (index >= stack.length) {
          return;
        }
        const layer = stack[index++];
        if (layer && typeof layer.handle === "function") {
          try {
            layer.handle(mockReq, mockRes, runNext);
          } catch (e) {
            runNext(e);
          }
        }
      };

      runNext();
      return;
    }
  }

  // Fallback: If route stack is not available (e.g. registered differently), delete lock to avoid lock starvation
  client.del(`swr-lock:${cacheKey}`).catch(() => {});
}

/**
 * Poll the cache store until a fresh entry appears or the maximum wait time elapses.
 * Used by non-leader servers during distributed stampede protection: instead of
 * executing the handler themselves, they wait for the leader to populate the cache.
 *
 * If the leader fails or the timeout expires, we fall through to `next()` so the
 * request is served normally (accepting the cost of one extra DB query).
 */
async function waitForCachePopulation(
  client: CacheClient,
  cacheKey: string,
  res: Response,
  staleTime: number,
  next: NextFunction,
  metrics?: CacheMetrics,
  maxAttempts = 10,
  intervalMs = 150,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        const entry = deserializeEntry(cached);
        if (entry) {
          if (metrics) metrics.stampedePolls++;
          sendCachedResponse(
            res,
            entry,
            getAgeSeconds(entry),
            staleTime,
            "HIT",
          );
          return;
        }
      }
    } catch {
      /* Ignore transient read errors during polling */
    }
  }
  // Timed out — let this request run the handler itself as a safety fallback
  next();
}

/** Extract headers worth caching from the response. */
function extractCacheableHeaders(res: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  const rawHeaders = res.getHeaders();

  for (const [key, value] of Object.entries(rawHeaders)) {
    if (!value) continue;

    const lowerKey = key.toLowerCase();
    // Skip cookie headers and internal express headers
    if (lowerKey === "set-cookie" || lowerKey.startsWith("x-express-")) {
      continue;
    }

    headers[key] = String(value);
  }

  return headers;
}

/**
 * Helper to execute a fetcher with exponential backoff retry logic.
 *
 * @param fetcher - The async function to execute.
 * @param retries - Total number of retries to attempt.
 * @returns The successful result of the fetcher.
 * @throws The last error encountered after all retries are exhausted.
 * @internal
 */
async function executeFetcherWithRetry<T>(
  fetcher: () => Promise<T>,
  retries: number,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetcher();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        // Exponential backoff: 200ms, 400ms, 800ms...
        const delay = Math.pow(2, i) * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
