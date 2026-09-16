---
"@express-route-cache/core": patch
---

Await epoch invalidation on 2xx `res.end` before flushing the mutation response so clients cannot refetch stale cache.
