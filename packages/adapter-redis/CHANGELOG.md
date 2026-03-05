# @express-route-cache/redis

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
