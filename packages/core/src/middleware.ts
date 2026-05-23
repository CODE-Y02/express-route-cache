import type { Request, Response, NextFunction } from "express";
import type {
  CacheClient,
  CacheConfig,
  CacheEntry,
  CacheInstance,
  RouteOptions,
} from "./types";
import {
  buildCacheKey,
  serializeEntry,
  deserializeEntry,
  getFreshness,
  getAgeSeconds,
  getParentRoutePatterns,
  getEpochKey,
} from "./utils";
import { LRUCache } from "lru-cache";

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
 */
const inflightRequests = new LRUCache<string, Promise<any>>({
  max: 5000, // Maximum pending locks to prevent memory leaks from massive unique key attacks
});

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

  const client = config.adapter;

  // ── Shared cache logic ──────────────────────────────────────────────

  function createCacheHandler(routeOpts?: RouteOptions) {
    return async function cacheHandler(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      // Handle auto-invalidation for non-GET mutation methods
      if (req.method !== "GET") {
        const autoInv = routeOpts?.autoInvalidate ?? globalOpts.autoInvalidate;
        if (autoInv) {
          res.on("finish", async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const pattern = routeOpts?.key
                ? null
                : (
                    await buildCacheKey(
                      client,
                      req,
                      globalOpts.keyPrefix,
                      [],
                      false,
                    )
                  ).routePattern;
              if (pattern) {
                await invalidateRoutes([pattern]);
              }
            }
          });
        }
        next();
        return;
      }

      // Check enabled
      const enabled = routeOpts?.enabled ?? globalOpts.enabled;
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
              sendCachedResponse(res, entry, age, staleTime, "HIT");
              return;
            }

            if (freshness === "stale" && swr) {
              // 🔄 Stale + SWR — serve stale, revalidate in background
              sendCachedResponse(res, entry, age, staleTime, "STALE");

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
              );
              return;
            }

            // Stale + no SWR, or expired → fall through to MISS
          }
        }

        // ── Cache MISS ────────────────────────────────────────────────

        // Stampede protection: coalesce concurrent requests
        if (globalOpts.stampede && inflightRequests.has(cacheKey)) {
          const entry = await inflightRequests.get(cacheKey)!;
          if (entry) {
            const age = getAgeSeconds(entry);
            sendCachedResponse(res, entry, age, staleTime, "HIT");
            return;
          }
          // entry is null (non-2xx) — fall through to re-execute
        }

        // Intercept res.json / res.send to capture the response
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
  }

  // ── Invalidation ────────────────────────────────────────────────────

  async function invalidateRoutes(routePatterns: string[]): Promise<void> {
    for (const pattern of routePatterns) {
      const epochKey = getEpochKey(pattern);
      await client.incr(epochKey);
    }
  }

  // ── Return the CacheInstance ────────────────────────────────────────

  return {
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
            if (ageSeconds < staleTime) {
              return (entry.data ?? entry.body) as T;
            }
            if (ageSeconds < totalTTL && swr) {
              // 🔄 Stale + SWR — serve stale, revalidate in background
              executeFetcherWithRetry(fetcher, retryCount)
                .then(async (data) => {
                  await client.set(
                    cacheKey,
                    JSON.stringify({ data, createdAt: Date.now() }),
                    totalTTL,
                  );
                })
                .catch(() => {
                  /* Background fail stays silent */
                });
              return (entry.data ?? entry.body) as T;
            }
          }
        } catch {
          /* Fall through to MISS */
        }
      }

      // ── Cache MISS ────────────────────────────────────────────────
      if (globalOpts.stampede && inflightRequests.has(cacheKey)) {
        return await inflightRequests.get(cacheKey);
      }

      const promise = executeFetcherWithRetry(fetcher, retryCount).then(
        async (data) => {
          await client.set(
            cacheKey,
            JSON.stringify({ data, createdAt: Date.now() }),
            totalTTL,
          );
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
  };
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

    // Capture writes
    res.write = function (chunk: any, ...args: any[]): boolean {
      if (chunk && !sizeExceeded) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        currentSize += buffer.length;
        if (currentSize > maxBodySize) {
          sizeExceeded = true;
          chunks.length = 0; // free memory
        } else {
          chunks.push(buffer);
        }
      }
      return originalWrite(chunk, ...args);
    } as typeof res.write;

    // Capture end
    res.end = function (chunk?: any, ...args: any[]): Response {
      if (intercepted) {
        return originalEnd(chunk, ...args);
      }
      intercepted = true;

      if (chunk && !sizeExceeded) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
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
        return originalEnd(chunk, ...args);
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

      return originalEnd(chunk, ...args);
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
): Promise<void> {
  // Create a Mock Response object inheriting from the real one but disabling network output
  const mockRes = Object.create(res);
  mockRes.statusCode = 200;
  Object.defineProperty(mockRes, "headersSent", {
    value: false,
    writable: true,
  });
  Object.defineProperty(mockRes, "finished", { value: false, writable: true });

  // Isolate headers
  const localHeaders = new Map<string, string | string[]>();
  mockRes.setHeader = (name: string, value: string | string[]) => {
    localHeaders.set(name.toLowerCase(), value);
    return mockRes;
  };
  mockRes.getHeader = (name: string) => localHeaders.get(name.toLowerCase());
  mockRes.removeHeader = (name: string) =>
    localHeaders.delete(name.toLowerCase());
  mockRes.getHeaders = () => Object.fromEntries(localHeaders);

  // Override output methods to prevent writing to real socket
  mockRes.write = () => true;
  mockRes.end = () => mockRes;

  // Now capture this fake output
  interceptResponse(
    req,
    mockRes as Response,
    next,
    client,
    cacheKey,
    totalTTL,
    staleTime,
    maxBodySize,
  ).catch(() => {});
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
  let lastError: any;
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
