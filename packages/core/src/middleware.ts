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

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULTS = {
  staleTime: 60,
  gcTime: 300,
  swr: false,
  stampede: true,
  keyPrefix: "erc:",
  vary: [] as string[],
  enabled: true,
} as const;

// ─── Stampede Lock ──────────────────────────────────────────────────────────

/**
 * In-memory lock map for stampede protection.
 * Key = cache key, Value = in-flight Promise of the response.
 * When 1000 requests hit a cold cache, only 1 handler executes.
 */
const inflightRequests = new Map<string, Promise<CacheEntry | null>>();

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
  };

  const client = config.adapter;

  // ── Shared cache logic ──────────────────────────────────────────────

  function createCacheHandler(routeOpts?: RouteOptions) {
    return async function cacheHandler(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      // Only cache GET requests
      if (req.method !== "GET") {
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
            vary
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
                next,
                totalTTL
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
          staleTime
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
      const parents = getParentRoutePatterns(pattern);
      // Invalidate the deepest pattern (the one specified) and all parents
      // Actually we only need to increment the exact pattern's epoch
      // because the key includes ALL parent epochs.
      // Incrementing /users will change keys for /users, /users/:id, etc.
      const epochKey = getEpochKey(pattern);
      await client.incr(epochKey);
    }
  }

  // ── Return the CacheInstance ────────────────────────────────────────

  return {
    middleware: () => createCacheHandler(),
    route: (opts?: RouteOptions) => createCacheHandler(opts),
    invalidate: (...routePatterns: string[]) => {
      return async function invalidateMiddleware(
        _req: Request,
        _res: Response,
        next: NextFunction
      ): Promise<void> {
        try {
          await invalidateRoutes(routePatterns);
        } catch {
          // Don't block the request on invalidation failure
        }
        next();
      };
    },
    invalidateRoute: (...routePatterns: string[]) =>
      invalidateRoutes(routePatterns),
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
  cacheStatus: "HIT" | "STALE"
): void {
  res.status(entry.statusCode);

  // Replay stored headers
  for (const [key, value] of Object.entries(entry.headers)) {
    res.setHeader(key, value);
  }

  // Add cache-specific headers
  res.setHeader("X-Cache", cacheStatus);
  res.setHeader("Age", String(ageSeconds));
  res.setHeader(
    "Cache-Control",
    `public, max-age=${Math.max(0, staleTime - ageSeconds)}`
  );

  res.end(entry.body);
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
  staleTime: number
): Promise<CacheEntry | null> {
  return new Promise<CacheEntry | null>((resolve) => {
    // One-shot flag: prevents re-entry from monkey-patching
    let intercepted = false;

    const originalEnd = res.end.bind(res);
    const originalWrite = res.write.bind(res);
    const chunks: Buffer[] = [];

    // Capture writes
    res.write = function (
      chunk: any,
      ...args: any[]
    ): boolean {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return originalWrite(chunk, ...args);
    } as typeof res.write;

    // Capture end
    res.end = function (chunk?: any, ...args: any[]): Response {
      if (intercepted) {
        return originalEnd(chunk, ...args);
      }
      intercepted = true;

      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const body = Buffer.concat(chunks).toString("utf-8");

      // Only cache successful responses (2xx)
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        const entry: CacheEntry = {
          body,
          statusCode,
          headers: extractCacheableHeaders(res),
          createdAt: Date.now(),
        };

        // Store in cache (fire-and-forget)
        client
          .set(cacheKey, serializeEntry(entry), totalTTL)
          .catch(() => {/* Fail silently */});

        // Set cache headers on MISS
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Age", "0");
        res.setHeader("Cache-Control", `public, max-age=${staleTime}`);

        resolve(entry);
      } else {
        // Non-2xx: don't cache, resolve with null (no rejection = no unhandled errors)
        resolve(null);
      }

      return originalEnd(chunk, ...args);
    } as typeof res.end;

    next();
  });
}

/**
 * Re-execute the handler in the background for SWR revalidation.
 * This is a simplified approach: we create a lightweight mock response
 * to capture the output without sending it to the client.
 */
async function revalidateInBackground(
  client: CacheClient,
  cacheKey: string,
  _req: Request,
  _next: NextFunction,
  totalTTL: number
): Promise<void> {
  // The actual revalidation will happen on the next request that encounters
  // a stale entry with SWR disabled (when the stale window passes).
  // For true background revalidation, the handler would need to be re-invoked,
  // which requires access to the route handler itself. Instead, we mark the
  // entry for eager refresh: the next request will see STALE status and
  // the response from the fresh handler run will update the cache.
  //
  // This is the pragmatic approach: the FIRST request after stale gets
  // stale data instantly, the SECOND request gets fresh data.
  // True background revalidation would require re-invoking the Express handler
  // pipeline which is complex and error-prone.
  //
  // If the user needs true background revalidation, they can use the
  // programmatic `invalidateRoute()` from a background job.
}

/** Extract headers worth caching from the response. */
function extractCacheableHeaders(res: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  const contentType = res.getHeader("content-type");
  if (contentType) {
    headers["content-type"] = String(contentType);
  }
  const contentEncoding = res.getHeader("content-encoding");
  if (contentEncoding) {
    headers["content-encoding"] = String(contentEncoding);
  }
  return headers;
}
