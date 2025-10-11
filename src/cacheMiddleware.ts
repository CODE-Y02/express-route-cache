import type { Request, Response, NextFunction } from "express";
import type { CacheClient } from "./types";
import { getCacheKey, getPatternSetKey, mutatingMethods } from "./utils";

interface CacheMiddlewareOptions {
  cacheClient: CacheClient;
  ttlSeconds?: number;
}

export function createCacheMiddleware({
  cacheClient,
  ttlSeconds = 60,
}: CacheMiddlewareOptions) {
  if (!cacheClient) throw new Error("cacheClient is required");
  return async function cacheMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.method !== "GET" || !req.route) {
      return next();
    }

    const routePattern = `${req.baseUrl}${req.route.path}`;
    const cacheKey = getCacheKey(req);
    const patternSetKey = getPatternSetKey(routePattern);

    try {
      const cachedBody = await cacheClient.get(cacheKey);
      if (cachedBody) {
        // Cache hit - respond immediately
        res.setHeader("X-Cache", "HIT");
        res.json(JSON.parse(cachedBody));
        return;
      }

      // Cache miss - hijack res.json to cache the response
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        try {
          const bodyStr = JSON.stringify(body);
          cacheClient.set(cacheKey, bodyStr, ttlSeconds);
          cacheClient.sadd(patternSetKey, cacheKey);
        } catch (err) {
          console.error("Cache set error:", err);
          // Fail silently, don't block response
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("Cache middleware error:", err);
      next(err);
    }
  };
}

export function createInvalidateMiddleware({
  cacheClient,
}: {
  cacheClient: CacheClient;
}) {
  if (!cacheClient) throw new Error("cacheClient is required");
  return async function invalidateMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (
      !mutatingMethods.includes(req.method as (typeof mutatingMethods)[number])
    ) {
      return next();
    }
    if (!req.route) {
      return next();
    }

    const routePattern = `${req.baseUrl}${req.route.path}`;
    const patternSetKey = getPatternSetKey(routePattern);

    try {
      // Get all cached keys for this pattern
      const keys = await cacheClient.smembers(patternSetKey);
      if (keys.length > 0) {
        await cacheClient.del(...keys);
        // Clear keys from set
        for (const key of keys) {
          await cacheClient.srem(patternSetKey, key);
        }
      }
    } catch (err) {
      // Optional: log error but don't block response
      console.error("Invalidate middleware error:", err);
    }

    next();
  };
}
