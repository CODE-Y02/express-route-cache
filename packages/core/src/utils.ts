import type { Request } from "express";

// Generate cache key: route pattern + full URL with query params
export function getCacheKey(req: Request): string {
  // Use req.baseUrl + req.route.path for pattern (Express internals)
  // fallback to originalUrl if route or baseUrl missing
  const routePattern =
    req.baseUrl && req.route && req.route.path
      ? `${req.baseUrl}${req.route.path}`
      : req.originalUrl;

  return `GET:${routePattern}:URL:${req.originalUrl}`;
}

// Normalize route pattern for set key tracking
export function getPatternSetKey(routePattern: string): string {
  return `PATTERN_KEYS:${routePattern}`;
}

// HTTP methods considered mutating
export const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"] as const;
