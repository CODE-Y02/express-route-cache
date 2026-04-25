# Stampede Protection

A "Cache Stampede" occurs when a popular cache entry expires and hundreds of concurrent requests hit the database simultaneously to refresh it.

## Request Coalescing

`@express-route-cache` prevents this by "coalescing" requests at the process level.

1. **First Request**: Hits a cache MISS. It starts executing the Express handler and stores a **Promise** in memory.
2. **Subsequent Requests**: If they arrive while the first request is still processing, they **await the existing Promise** instead of starting a new handler execution.
3. **Completion**: Once the first request finishes, all waiting requests resolve with the same data simultaneously.

## Configuration

Stampede protection is **enabled by default**. You can toggle it if needed:

```ts
const cache = createCache({
  stampede: true, // Default
});
```
