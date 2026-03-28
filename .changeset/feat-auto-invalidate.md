---
"@express-route-cache/core": minor
"@express-route-cache/redis": patch
"@express-route-cache/memcached": patch
---

feat: add `autoInvalidate` option for automatic O(1) route clearing on mutations (POST, PUT, DELETE, PATCH).

This update also includes critical bug fixes:
- Fix binary data corruption by using Base64 serialization.
- Preserve all non-sensitive response headers on cache replay.
- Respect manual `Cache-Control` headers from handlers.
- Resolve invalidation race conditions by moving logic to the `res.on('finish')` hook.
