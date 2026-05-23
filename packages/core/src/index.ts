// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  CacheClient,
  CacheConfig,
  CacheEntry,
  CacheInstance,
  RouteOptions,
  ExpressMiddleware,
  DataEntry,
} from "./types";

// ─── Core Factory ───────────────────────────────────────────────────────────
export { createCache } from "./middleware";

// ─── Built-in Adapter ───────────────────────────────────────────────────────
export { createMemoryAdapter } from "./adapters/memory";

// ─── Utilities (for advanced/custom use) ────────────────────────────────────
export {
  getRoutePattern,
  getParentRoutePatterns,
  buildVersionedKey,
  buildCacheKey,
  getFreshness,
  getAgeSeconds,
} from "./utils";
