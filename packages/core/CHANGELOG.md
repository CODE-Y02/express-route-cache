# @express-route-cache/core

## 0.2.0

### Minor Changes

- e83284d: feat: add `autoInvalidate` option for automatic O(1) route clearing on mutations (POST, PUT, DELETE, PATCH).

  This update also includes critical bug fixes:
  - Fix binary data corruption by using Base64 serialization.
  - Preserve all non-sensitive response headers on cache replay.
  - Respect manual `Cache-Control` headers from handlers.
  - Resolve invalidation race conditions by moving logic to the `res.on('finish')` hook.

## 0.1.3

### Patch Changes

- e610874: - **Fix (Security):** Added `lru-cache` to `inflightRequests` map for Stampede Protection. This enforces a maximum ceiling of 5,000 pending locks, completely neutralizing Denial-Of-Service / Out Of Memory vulnerabilities caused by massive unique-query cache bust attacks.
  - **Fix (Performance):** Fully implemented the Next.js Mock Response pattern for Stale-While-Revalidate (`swr: true`). Previous versions only delayed the miss to the next user. The library now uses `Object.create(res)` to seamlessly execute your Express middleware pipeline in the background and silently dump the fresh data directly into Redis without throwing `ERR_HTTP_HEADERS_SENT` socket errors.
  - **Feature (Safety):** Added `maxBodySize` parameter to `CacheConfig` (defaults to 2MB). Responses larger than this threshold are instantly flushed to the user and bypass the caching layer entirely, protecting Node.js V8 heap limits against stream-buffering massive gigabyte file downloads.

## 0.1.2

### Patch Changes

- ad66ac8: - **Fix**: Reordered `res.setHeader` in internal middleware for cache miss scenarios to prevent `ERR_HTTP_HEADERS_SENT` crashes when requests have been partially flushed.
  - **Fix**: The Redis and Memcached adapters are now much safer to use with shared database connection lifecycle. They correctly recognize when you pass an existing `client` instance (via `ops.client`) and will intentionally "opt-out" of closing the target connection when teardowns occur.
  - **Feature**: Added a new optional `sortQuery` boolean flag (defaults to `false`) to `CacheConfig` & `RouteOptions`. When enabled, this sorts query parameter names lexicographically (e.g., `?a=1&b=2` equals `?b=2&a=1`) before generating caching hashes to ensure identical API requests have deterministic, hit-producing keys.

## 0.1.1

### Patch Changes

- Update documentation across all packages with detailed READMEs.

## 0.1.0

### Minor Changes

- TanStack-inspired route cache with O(1) epoch invalidation, SWR, stampede protection, and adapter pattern
