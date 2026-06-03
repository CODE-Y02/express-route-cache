---
title: "API Reference | @express-route-cache"
description: "Detailed documentation for createCache, middleware, route options, the standalone fetch API, CacheClient interface, and exported utilities."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/reference/api
  - - meta
    - property: og:title
      content: "API Reference | @express-route-cache"
  - - meta
    - property: og:description
      content: "Full API docs for createCache, route middleware, standalone fetch, invalidation middleware, and programmatic invalidation with all config options."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/reference/api
---

# API Reference

## `createCache(config)`

The main entry point for initializing the caching layer.

### `CacheConfig` Options

| Option           | Type                       | Default   | Description                                                                            |
| :--------------- | :------------------------- | :-------- | :------------------------------------------------------------------------------------- |
| `adapter`        | `CacheClient`              | —         | **Required**. Storage adapter (Memory, Redis, Memcached).                              |
| `staleTime`      | `number`                   | `60`      | Seconds data stays fresh. During this window, cached responses are returned instantly. |
| `gcTime`         | `number`                   | `300`     | Seconds stale data is kept in cache before eviction. Total TTL = `staleTime + gcTime`. |
| `swr`            | `boolean`                  | `false`   | Enable Stale-While-Revalidate background refresh.                                      |
| `stampede`       | `boolean`                  | `true`    | Prevent thundering-herd via request coalescing.                                        |
| `vary`           | `string[]`                 | `[]`      | Request headers to include in the cache key (e.g. `['authorization']`).                |
| `sortQuery`      | `boolean`                  | `false`   | Sort query params alphabetically for higher hit rates (`?a=1&b=2` ≡ `?b=2&a=1`).       |
| `maxBodySize`    | `number`                   | `2097152` | Max response size in bytes to cache (default: 2MB). Larger responses skip the cache.   |
| `autoInvalidate` | `boolean`                  | `false`   | Auto-invalidate route pattern epochs on successful POST, PUT, PATCH, or DELETE.        |
| `retry`          | `number`                   | `0`       | Retries with exponential backoff for `cache.fetch()` on failure.                       |
| `keyPrefix`      | `string`                   | `"erc:"`  | Global prefix for all cache keys in Redis/Memcached.                                   |
| `enabled`        | `boolean \| ((req: Request, res: Response) => boolean)` | `true`    | Toggle caching globally. Accepts boolean or callback function.                         |
| `metrics`        | `boolean`                  | `false`   | Enable real-time telemetry metrics collection (required for Cache Studio charts).      |
| `studio`         | `boolean \| StudioOptions` | `false`   | Enable the Cache Studio visual dashboard or configure a standalone server.             |

### Returns (`CacheInstance`)

| Property                       | Type                                           | Description                                                        |
| :----------------------------- | :--------------------------------------------- | :----------------------------------------------------------------- |
| `middleware()`                 | `() => ExpressMiddleware`                      | Global middleware — caches all GET requests. Use with `app.use()`. |
| `route(opts?)`                 | `(opts?: RouteOptions) => ExpressMiddleware`   | Per-route middleware with optional overrides.                      |
| `invalidate(...patterns)`      | `(...patterns: string[]) => ExpressMiddleware` | Middleware: increments epochs on successful (2xx) response.        |
| `invalidateRoute(...patterns)` | `(...patterns: string[]) => Promise<void>`     | Programmatic invalidation from outside a request context.          |
| `fetch(key, fetcher, opts?)`   | `<T>(key, fetcher, opts?) => Promise<T>`       | Standalone data caching with SWR, Stampede, and Retry support.     |
| `adapter`                      | `CacheClient`                                  | The underlying storage adapter instance.                           |
| `metrics`                      | `CacheMetrics \| undefined`                    | Live telemetry counters (only defined when `metrics: true`).       |
| `studio`                       | `boolean \| StudioOptions \| undefined`        | Studio configuration reference passed through from config.         |

---

## `cache.route(overrides?)`

Apply specific caching rules to an individual route. All `RouteOptions` override global `CacheConfig` values for that route only.

### `RouteOptions`

| Option           | Type                                 | Description                                                                                                                    |
| :--------------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `staleTime`      | `number`                             | Override global `staleTime` for this route.                                                                                    |
| `gcTime`         | `number`                             | Override global `gcTime` for this route.                                                                                       |
| `swr`            | `boolean`                            | Override global `swr` for this route.                                                                                          |
| `enabled`        | `boolean \| ((req: Request, res: Response) => boolean)` | Disable or enable caching for this route. Accepts boolean or callback function. Explicitly setting this to `true` or a callback allows caching `POST` / non-`GET` requests. |
| `vary`           | `string[]`                           | Override global `vary` for this route.                                                                                         |
| `sortQuery`      | `boolean`                            | Override global `sortQuery` for this route.                                                                                    |
| `maxBodySize`    | `number`                             | Override global `maxBodySize` for this route.                                                                                  |
| `autoInvalidate` | `boolean`                            | Override global `autoInvalidate` for this route. **No-op when `key` override is also set** — use `cache.invalidate()` instead. |
| `retry`          | `number`                             | Override global `retry` for this route.                                                                                        |
| `key`            | `string \| (req: Request) => string` | **Custom key override.** If provided, used instead of the auto-generated versioned key.                                        |

```ts
app.get(
  "/heavy-report",
  cache.route({
    staleTime: 3600, // 1 hour
    swr: true,
    key: (req) => `report:${req.user.id}`,
  }),
  handler,
);
```

---

## `cache.fetch(key, fetcher, opts?)`

Standalone method for manual data caching — not tied to Express routes. Includes full SWR, Stampede Protection, and Retry logic.

For more advanced usage, see the [Standalone Fetch Guide](../guide/cache-fetch).

```ts
const data = await cache.fetch(
  "users-list",
  async () => {
    return await db.users.findMany();
  },
  {
    staleTime: 60,
    swr: true,
    retry: 3,
  },
);
```

| Option        | Type      | Description                                              |
| :------------ | :-------- | :------------------------------------------------------- |
| `staleTime`   | `number`  | Seconds data stays fresh.                                |
| `gcTime`      | `number`  | Seconds stale data is kept.                              |
| `swr`         | `boolean` | Enable background revalidation on stale hit.             |
| `enabled`     | `boolean` | Disable caching for this call.                           |
| `maxBodySize` | `number`  | Max serialized payload size.                             |
| `retry`       | `number`  | Retry count with exponential backoff on fetcher failure. |

---

## `cache.invalidate(...patterns)`

Express middleware that increments the epoch version for specific patterns upon a successful (2xx) response.

```ts
app.post("/api/posts", cache.invalidate("/api/posts"), createPost);
```

---

## `cache.invalidateRoute(...patterns)`

Programmatic invalidation — call from anywhere (service layer, cron job, webhook handler).

```ts
await cache.invalidateRoute("/api/users/123", "/api/users");
```

---

## `StudioOptions`

Passed as `studio: { ... }` inside `createCache()`.

| Option     | Type      | Default       | Description                                                                           |
| :--------- | :-------- | :------------ | :------------------------------------------------------------------------------------ |
| `enabled`  | `boolean` | `true`        | Enable or disable the Studio integration.                                             |
| `port`     | `number`  | —             | If set, auto-starts a standalone Studio Express server on this port.                  |
| `path`     | `string`  | `"/studio"`   | Mount path for the dashboard.                                                         |
| `hostname` | `string`  | `"localhost"` | Hostname used in the console log URL message only (does not affect the bind address). |

---

## `CacheMetrics`

Exposed via `cache.metrics` when `metrics: true` is set in config.

```ts
const cache = createCache({ adapter, metrics: true });

// Poll metrics from a health endpoint
app.get("/health/cache", (req, res) => {
  res.json(cache.metrics);
});
```

| Field               | Type     | Description                                                                          |
| :------------------ | :------- | :----------------------------------------------------------------------------------- |
| `hits`              | `number` | Fresh cache hits served instantly.                                                   |
| `misses`            | `number` | Cache misses that required handler execution.                                        |
| `swrHits`           | `number` | Stale responses served while a background revalidation was triggered.                |
| `swrFailures`       | `number` | Background revalidation attempts that threw an error.                                |
| `stampedeCoalesces` | `number` | Requests that coalesced onto an in-flight Promise instead of running the handler.    |
| `stampedePolls`     | `number` | Follower-server poll attempts resolved from the distributed cache (Redis/Memcached). |

---

## `CacheClient` Interface

The contract that every adapter must satisfy. Implement this interface to build a custom adapter.

```ts
import type { CacheClient } from '@express-route-cache/core';

const myAdapter: CacheClient = {
  name: "custom-adapter",
  async ping() { return true; },
  async get(key) { ... },
  async mget(keys) { ... },
  async set(key, value, ttlSeconds) { ... },
  async del(...keys) { ... },
  async incr(key) { ... },
  // Optional:
  async setNX(key, value, ttlSeconds) { ... },
  async keys(pattern) { ... },
  async disconnect() { ... },
};
```

| Method / Prop | Signature                                                       | Required | Description                                                                               |
| :------------ | :-------------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------- |
| `name`        | `string`                                                        | Optional | Human-readable adapter name used by Cache Studio for adapter type diagnostics.            |
| `ping`        | `() => Promise<boolean>`                                        | Optional | Connection health check returning `true` on active connection; used by Cache Studio.      |
| `get`         | `(key: string) => Promise<string \| null>`                      | ✅       | Retrieve a value. Returns `null` on miss.                                                 |
| `mget`        | `(keys: string[]) => Promise<(string \| null)[]>`               | ✅       | Batch retrieve. Returns array in same order, `null` for misses.                           |
| `set`         | `(key: string, value: string, ttl?: number) => Promise<void>`   | ✅       | Store a value with optional TTL in seconds.                                               |
| `del`         | `(...keys: string[]) => Promise<void>`                          | ✅       | Delete one or more keys.                                                                  |
| `incr`        | `(key: string) => Promise<number>`                              | ✅       | Atomically increment a counter (creates at 1 if missing). Used for epoch versioning.      |
| `setNX`       | `(key: string, value: string, ttl: number) => Promise<boolean>` | Optional | Atomically set only if key doesn't exist. Enables **distributed** Stampede + SWR locking. |
| `keys`        | `(pattern?: string) => Promise<string[]>`                       | Optional | Enumerate all keys (optionally filtered). Required for Cache Studio key browser.          |
| `disconnect`  | `() => Promise<void>`                                           | Optional | Cleanup/disconnect hook. Called when the app shuts down.                                  |

> [!IMPORTANT]
> Implementing `setNX` unlocks distributed Stampede Protection and SWR locking across multiple server instances. Without it, only in-process coalescing is active.

---

## Advanced Utilities

These functions are exported from `@express-route-cache/core` for advanced use cases such as building custom adapters, debugging cache keys, or implementing custom invalidation strategies.

```ts
import {
  getRoutePattern,
  getParentRoutePatterns,
  buildVersionedKey,
  buildCacheKey,
  generateCacheKey,
  getFreshness,
  getAgeSeconds,
} from "@express-route-cache/core";
```

| Export                                                  | Description                                                                                 |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| `getRoutePattern(req)`                                  | Extracts the Express route pattern from a request (e.g. `/users/:id`).                      |
| `getParentRoutePatterns(route)`                         | Returns all ancestor patterns for a route path (used for cascade invalidation).             |
| `buildVersionedKey(opts)`                               | Constructs a SHA-256 hashed cache key incorporating epochs, vary headers, and query params. |
| `buildCacheKey(client, req, prefix, vary?, sortQuery?)` | Async wrapper that fetches epochs and calls `buildVersionedKey`.                            |
| `generateCacheKey(tag, data, prefix?)`                  | Generates a type-safe SHA-256 hashed cache key based on a custom tag and uniqueness data.   |
| `getFreshness(entry, staleTime, gcTime)`                | Returns `"fresh"` \| `"stale"` \| `"expired"` for a cache entry.                            |
| `getAgeSeconds(entry)`                                  | Returns the age of a cache entry in seconds.                                                |
