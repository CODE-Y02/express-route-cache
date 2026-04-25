# Stale-While-Revalidate (SWR)

Latency spikes are the enemy of a great user experience. `@express-route-cache` uses SWR to ensure your users never wait for a database refresh.

## How it Works

When a request arrives for a **stale** entry (older than `staleTime` but younger than `gcTime`):

1. **Instant HIT**: The server immediately serves the stale data from the cache.
2. **Background Refresh**: The server continues to execute your Express handler in the background.
3. **Cache Update**: Once the handler returns fresh data, the cache is updated for the next request.

## Enabling SWR

SWR is disabled by default. You can enable it globally or per-route:

```ts
// Global
const cache = createCache({
  swr: true,
  staleTime: 60, // Fresh for 60s
  gcTime: 3600,   // Kept for 1 hour
});

// Per-route override
app.get('/slow-api', cache.route({ swr: true }), handler);
```

## Benefits

- **Zero Latency Spikes**: Users always get an instant response.
- **Improved Uptime**: Even if your database is momentarily slow or down, the cache can serve stale data while attempting a refresh.
