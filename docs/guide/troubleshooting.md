---
title: "Troubleshooting | @express-route-cache"
description: "Solutions for common issues like cache zombies, high memory usage, SWR failures, and unexpected cache misses."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/troubleshooting
  - - meta
    - property: og:title
      content: "Troubleshooting Express.js Cache Problems | @express-route-cache"
  - - meta
    - property: og:description
      content: "Diagnose and fix common caching bugs: zombie cache entries, unexpected MISS, high memory usage, and invalidation not working."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/troubleshooting
---

# Troubleshooting

## Common Issues

### Cache Not Updating (Zombies)

If you find that your cache isn't updating after a mutation, check the following:

1. **Epoch Mismatch**: Ensure you are invalidating the correct route pattern. The pattern must match what `getRoutePattern()` returns (e.g. `/api/users/:id`, not `/api/users/123`).
2. **Success Status**: Invalidation only triggers on **2xx** responses. If your POST/PUT fails, the cache won't be invalidated.
3. **Race Conditions**: SWR can sometimes serve stale data if a refresh is still pending.

### High Memory Usage

If your Node.js process is consuming too much memory:

1. **Reduce `maxBodySize`**: Prevent large responses from being buffered.
2. **Shorten `gcTime`**: Evict stale data more aggressively.
3. **Use Redis**: Offload the cache storage from your Node.js heap to an external Redis instance.

### Unexpected MISS on GET requests

1. **Vary Headers**: If you use `vary`, any change in those headers will cause a MISS.
2. **Query Params**: If `sortQuery` is false (default), `?a=1&b=2` and `?b=2&a=1` are treated as different routes.
3. **Enabled flag**: Check that `enabled` is not set to `false` globally or per-route.

### SWR Background Revalidation Failing

If you see the following message in your logs:

```
[@express-route-cache] SWR background revalidation failed. Check your route handler for errors.
```

This means your route handler threw an error during a background SWR refresh. Common causes:
- An unhandled `async` rejection inside the route handler.
- A missing database connection or service dependency that is only available during normal request flow.
- Middleware that inspects `req.socket` and throws when it detects the mock/background request object.

The stale cache entry will continue to be served until the next successful revalidation attempt.

## Debugging

You can inspect the `X-Cache` header in your browser's network tab or via `curl`:

```bash
curl -I http://localhost:3000/api/data
```

Look for:
- `X-Cache: HIT` — Serving a fresh entry from cache
- `X-Cache: MISS` — Fetched from the handler (cache was cold or expired)
- `X-Cache: STALE` — Serving stale data; a background revalidation was triggered

Also useful: the `Age` header tells you how many seconds old the cached entry is.
