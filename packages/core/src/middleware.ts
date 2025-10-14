import type { Request, Response, NextFunction } from "express";
import type { CacheClient, CacheMiddlewareOptions } from "./types";
import {
  getCacheKeyForRoute,
  getPatternSetKey,
  getParentRoutePatterns,
  invalidatePath,
  mutatingMethods,
} from "./utils";

// Cache GET responses
export function createCacheMiddleware({
  cacheClient,
  ttlSeconds = 60,
}: CacheMiddlewareOptions) {
  return async function cacheMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.method !== "GET" || !req.route) {
      return next();
    }

    const routePattern = `${req.baseUrl}${req.route.path}`;
    const cacheKey = getCacheKeyForRoute(req);
    const parentPatterns = getParentRoutePatterns(routePattern);

    try {
      const cachedBody = await cacheClient.get(cacheKey);
      if (cachedBody) {
        res.setHeader("X-Cache", "HIT");
        return res.json({
          fromCache: true,
          data: JSON.parse(cachedBody),
        });
      }

      // Cache miss - hijack res.json to cache the response
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        try {
          const bodyStr = JSON.stringify(body);
          cacheClient.set(cacheKey, bodyStr, ttlSeconds);
          for (const pattern of parentPatterns) {
            const patternSetKey = getPatternSetKey(pattern);
            cacheClient.sadd(patternSetKey, cacheKey);
          }
        } catch (err) {
          // Fail silently, don't block response
          // Optionally log error here
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Invalidate cache on mutating requests
export function createInvalidateMiddleware({
  cacheClient,
}: {
  cacheClient: CacheClient;
}) {
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
    await invalidatePath(cacheClient, routePattern);

    next();
  };
}
