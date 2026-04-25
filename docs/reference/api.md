# API Reference

## `createCache(config)`

The main entry point for initializing the caching layer.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `adapter` | `CacheClient` | — | **Required**. Storage adapter (Memory, Redis, Memcached). |
| `staleTime` | `number` | `60` | Seconds data stays fresh. |
| `gcTime` | `number` | `300` | Seconds stale data stays in cache before eviction. |
| `swr` | `boolean` | `false` | Enable background revalidation. |
| `stampede` | `boolean` | `true` | Prevent "thundering herd" via request coalescing. |
| `vary` | `string[]` | `[]` | Headers to namespace caches (e.g., `['authorization']`). |
| `sortQuery` | `boolean` | `false` | Sort query params deterministically for higher hit rates. |
| `maxBodySize` | `number` | `2097152` | Max response size in bytes (default: 2MB). |
| `autoInvalidate` | `boolean` | `false` | Auto-invalidate route patterns on successful mutations. |
| `enabled` | `boolean` | `true` | Toggle caching globally. |

### Returns

- `middleware()`: Global Express middleware.
- `route(options)`: Per-route middleware with overrides.
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
