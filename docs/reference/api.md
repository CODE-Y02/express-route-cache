---
title: "API Reference | @express-route-cache"
description: "Detailed documentation for createCache, middleware, route options, and the standalone fetch API."
---

# API Reference

## `createCache(config)`

The main entry point for initializing the caching layer.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `adapter` | `CacheClient` | — | **Required**. Storage adapter (Memory, Redis, Memcached). |
| `staleTime` | `number` | `60` | Seconds data stays fresh (TanStack: `staleTime`). |
| `gcTime` | `number` | `300` | Seconds stale data stays in cache (TanStack: `gcTime`). |
| `swr` | `boolean` | `false` | Enable background revalidation. |
| `stampede` | `boolean` | `true` | Prevent "thundering herd" via request coalescing. |
| `vary` | `string[]` | `[]` | Headers to namespace caches (e.g., `['Authorization']`). |
| `sortQuery` | `boolean` | `false` | Sort query params alphabetically for higher hit rates. |
| `maxBodySize` | `number` | `2097152` | Max response size in bytes (default: 2MB). |
| `autoInvalidate` | `boolean` | `false` | Auto-invalidate route patterns on successful mutations. |
| `retry` | `number` | `0` | Number of retries with exponential backoff (fetch only). |
| `keyPrefix` | `string` | `"erc:"` | Global prefix for all cache keys in Redis/Memcached. |
| `enabled` | `boolean` | `true` | Toggle caching globally. |
| `key` | `string \| fn` | — | **(Route only)** Manual key override (string or `(req) => string`). |

### Returns

- `middleware()`: Global Express middleware.
- `route(options)`: Per-route middleware with overrides.
- `fetch(key, fetcher, options)`: Standalone data caching method.
- `invalidate(...patterns)`: Middleware to trigger invalidation.
- `invalidateRoute(...patterns)`: Programmatic invalidation method.
- `adapter`: The underlying storage adapter instance.

---

## `cache.route(overrides)`

Use this to apply specific caching rules to individual routes.

```ts
app.get('/heavy-report', cache.route({ 
  staleTime: 3600, // 1 hour
  swr: true 
}), handler);
```

---

## `cache.fetch(key, fetcher, options)`

Standalone method for manual data caching. Includes full SWR, Stampede Protection, and Retries.

```ts
const data = await cache.fetch('my-key', async () => {
  return await db.users.findMany();
}, { 
  staleTime: 60, 
  swr: true, 
  retry: 3 
});
```

---

## `cache.invalidate(...patterns)`

Express middleware that increments the epoch version for specific patterns upon successful (2xx) response.

```ts
app.post('/api/posts', cache.invalidate('/api/posts'), createPost);
```

---

## `cache.invalidateRoute(...patterns)`

A programmatic way to invalidate routes from outside an Express request context.

```ts
await cache.invalidateRoute('/api/users/123');
```
