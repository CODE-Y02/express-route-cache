# @express-route-cache/redis

## 0.3.0

### Minor Changes

- feat: distributed stampede/SWR locking, SHA-256 key hashing, binary support
  - Add setNX to CacheClient interface (optional, backward-compatible)
  - Implement setNX in Memory, Redis, Memcached adapters
  - Redis adapter: enableOfflineQueue: false to fail-fast on disconnect
  - Two-tier distributed stampede protection: adapter setNX (cross-server) → LRU fallback (per-process)
  - Two-tier SWR lock: adapter setNX (cross-server) → localSwrLocks Set (per-process fallback)
  - Non-leader servers poll cache via waitForCachePopulation (150ms × 10 = 1.5s max)
  - SHA-256 hash all cache keys (fixes Memcached 250-char limit)
  - Fix binary data corruption in res.write (encoding passthrough)
  - Fix client abort releasing stampede lock (req.on close)
  - Add Buffer base64 serialization in cache.fetch
  - Auto-invalidation uses getRoutePattern directly (removes MGET overhead)
  - SWR background revalidation uses route stack direct execution (Express 5 fix)

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@1.2.0

## 0.2.1

### Patch Changes

- Updated dependencies [273105e]
  - @express-route-cache/core@1.1.0

## 0.2.0

### Minor Changes

- Support for auto invalidate & few critical bug fixes

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@1.0.0

## 0.1.4

### Patch Changes

- e83284d: feat: add `autoInvalidate` option for automatic O(1) route clearing on mutations (POST, PUT, DELETE, PATCH).

  This update also includes critical bug fixes:
  - Fix binary data corruption by using Base64 serialization.
  - Preserve all non-sensitive response headers on cache replay.
  - Respect manual `Cache-Control` headers from handlers.
  - Resolve invalidation race conditions by moving logic to the `res.on('finish')` hook.

- Updated dependencies [e83284d]
  - @express-route-cache/core@0.2.0

## 0.1.3

### Patch Changes

- Updated dependencies [e610874]
  - @express-route-cache/core@0.1.3

## 0.1.2

### Patch Changes

- ad66ac8: - **Fix**: Reordered `res.setHeader` in internal middleware for cache miss scenarios to prevent `ERR_HTTP_HEADERS_SENT` crashes when requests have been partially flushed.
  - **Fix**: The Redis and Memcached adapters are now much safer to use with shared database connection lifecycle. They correctly recognize when you pass an existing `client` instance (via `ops.client`) and will intentionally "opt-out" of closing the target connection when teardowns occur.
  - **Feature**: Added a new optional `sortQuery` boolean flag (defaults to `false`) to `CacheConfig` & `RouteOptions`. When enabled, this sorts query parameter names lexicographically (e.g., `?a=1&b=2` equals `?b=2&a=1`) before generating caching hashes to ensure identical API requests have deterministic, hit-producing keys.
- Updated dependencies [ad66ac8]
  - @express-route-cache/core@0.1.2

## 0.1.1

### Patch Changes

- Update documentation across all packages with detailed READMEs.
- Updated dependencies
  - @express-route-cache/core@0.1.1

## 0.1.0

### Minor Changes

- TanStack-inspired route cache with O(1) epoch invalidation, SWR, stampede protection, and adapter pattern

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@0.1.0
