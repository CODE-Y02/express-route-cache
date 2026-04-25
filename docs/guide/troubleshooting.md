# Troubleshooting

## Common Issues

### Cache Not Updating (Zombies)

If you find that your cache isn't updating after a mutation, check the following:

1. **Epoch Mismatch**: Ensure you are invalidating the correct route pattern.
2. **Success Status**: Invalidation only triggers on **2xx** responses. If your POST/PUT fails, the cache won't be invalidated.
3. **Race Conditions**: SWR can sometimes serve stale data if a refresh is still pending.

### High Memory Usage

If your Node.js process is consuming too much memory:

1. **Reduce `maxBodySize`**: Prevent large responses from being buffered.
2. **Shorten `gcTime`**: Evict stale data more aggressively.
3. **Use Redis**: Offload the cache storage from your Node.js heap to an external Redis instance.

### Unexpected MISS on GET requests

1. **Vary Headers**: If you use `vary`, any change in those headers will cause a MISS.
2. **Query Params**: If `sortQuery` is false, `?a=1&b=2` and `?b=2&a=1` are treated as different routes.

## Debugging

You can inspect the `X-Cache` header in your browser's network tab or via `curl`:

```bash
curl -I http://localhost:3000/api/data
```

Look for:
- `X-Cache: HIT` (Serving from cache)
- `X-Cache: MISS` (Fetched from source)
- `X-Cache: STALE` (Serving stale, refreshing in background)
