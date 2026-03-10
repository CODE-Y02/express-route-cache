---
"@express-route-cache/core": patch
---

- **Fix (Security):** Added `lru-cache` to `inflightRequests` map for Stampede Protection. This enforces a maximum ceiling of 5,000 pending locks, completely neutralizing Denial-Of-Service / Out Of Memory vulnerabilities caused by massive unique-query cache bust attacks.
- **Fix (Performance):** Fully implemented the Next.js Mock Response pattern for Stale-While-Revalidate (`swr: true`). Previous versions only delayed the miss to the next user. The library now uses `Object.create(res)` to seamlessly execute your Express middleware pipeline in the background and silently dump the fresh data directly into Redis without throwing `ERR_HTTP_HEADERS_SENT` socket errors. 
- **Feature (Safety):** Added `maxBodySize` parameter to `CacheConfig` (defaults to 2MB). Responses larger than this threshold are instantly flushed to the user and bypass the caching layer entirely, protecting Node.js V8 heap limits against stream-buffering massive gigabyte file downloads.
