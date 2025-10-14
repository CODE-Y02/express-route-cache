import crypto from "crypto";
import type { Request } from "express";
import type { CacheClient } from "./types";

// Generate cache key for a request (including query params hashed)
export function getCacheKeyForRoute(req: Request): string {
  const routePattern = `${req.baseUrl}${req.route?.path || req.path}`;
  const queryHash = Object.keys(req.query).length
    ? crypto.createHash("md5").update(JSON.stringify(req.query)).digest("hex")
    : "";
  return `GET:${routePattern}${queryHash ? `?${queryHash}` : ""}`;
}

// Key for storing pattern => cacheKey sets
export function getPatternSetKey(routePattern: string): string {
  return `PATTERN_KEYS:${routePattern}`;
}

// HTTP methods that mutate data
export const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"] as const;

/**
 * Given a route pattern string, returns all parent routes including itself.
 * E.g. '/products/:id/details' => ['/products', '/products/:id', '/products/:id/details']
 */
export function getParentRoutePatterns(route: string): string[] {
  const segments = route.split("/").filter(Boolean);
  const patterns: string[] = [];

  for (let i = 1; i <= segments.length; i++) {
    const partial = "/" + segments.slice(0, i).join("/");
    patterns.push(partial);
  }
  return patterns;
}

/**
 * Invalidate cache keys for given route patterns and their tracked cache keys.
 */
export async function invalidateCacheForPatterns(
  cacheClient: CacheClient,
  patterns: string[]
) {
  try {
    for (const pattern of patterns) {
      const patternSetKey = getPatternSetKey(pattern);
      const cacheKeys = await cacheClient.smembers(patternSetKey);

      if (cacheKeys.length) {
        await cacheClient.del(...cacheKeys);
        for (const key of cacheKeys) {
          await cacheClient.srem(patternSetKey, key);
        }
      }
    }
  } catch (err) {
    console.error("Error invalidating cache for patterns:", err);
  }
}

/**
 * Invalidate cache for a route and all its subroutes by invalidating
 * parent routes first to child.
 */
export async function invalidatePath(cacheClient: CacheClient, route: string) {
  const parentPatterns = getParentRoutePatterns(route);
  await invalidateCacheForPatterns(cacheClient, parentPatterns);
}
