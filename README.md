# @express-route-cache

> **TanStack Query for the backend** — Production-grade, drop-in route caching for Express.js with O(1) invalidation.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why?

Every existing Express caching middleware (`apicache`, `route-cache`, `cache-express`) shares the same production pain-points:

| Problem                    | Existing Packages | This Library                                              |
| -------------------------- | ----------------- | --------------------------------------------------------- |
| O(N) invalidation          | ❌ scan all keys  | ✅ O(1) epoch `incr`                                      |
| No server-side SWR         | ❌                | ✅ serve stale, revalidate in background                  |
| Stampede / thundering herd | ❌                | ✅ in-flight request coalescing                           |
| Locked to one cache store  | ❌                | ✅ Adapter pattern: Memory, Redis, Memcached              |
| Familiar DX                | ❌                | ✅ TanStack Query–inspired (`staleTime`, `gcTime`, `swr`) |

## Quick Start

```bash
npm install @express-route-cache/core
# For Redis:  npm install @express-route-cache/redis ioredis
# For Memcached: npm install @express-route-cache/memcached memjs
```

```ts
import express from "express";
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const app = express();
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60, // data fresh for 60 seconds
  gcTime: 300, // stale data kept 5 more minutes
  swr: true, // serve stale + revalidate in background
});

// Cache all GET routes
app.use(cache.middleware());

// Or per-route with overrides
app.get("/users/:id", cache.route({ staleTime: 120 }), getUser);

// Auto-invalidate on mutation
app.post("/users", cache.invalidate("/users"), createUser);
```

## How It Works

### Cache Lifecycle (TanStack-Inspired)

```
Request → Is data FRESH? (age < staleTime)
           │ YES → Return cached ⚡ (X-Cache: HIT)
           │ NO  → Is data STALE? (age < staleTime + gcTime)
           │        │ YES + swr:true  → Return stale 🔄, revalidate in background
           │        │ YES + swr:false → Cache MISS, re-fetch
           │        │ NO (expired)    → Evicted. Cache MISS.
```

### O(1) Epoch Invalidation

Instead of tracking cache keys in Sets (O(N) to delete), each route pattern has an **epoch counter**. Cache keys include the epoch version:

```
Cache key: "erc:GET:/users/123?abc|v:/users=0|v:/users/123=0"
```

To invalidate `/users`: just `INCR epoch:/users` → **O(1)**. All future requests generate keys with the new epoch → automatic cache miss. Old entries self-expire via `gcTime`.

### Stampede Protection

When 1000 concurrent requests hit a cold cache key, only **1 handler executes**. All others await the same in-flight Promise and receive the result.

## Packages

| Package                          | Description                      |
| -------------------------------- | -------------------------------- |
| `@express-route-cache/core`      | Core library + in-memory adapter |
| `@express-route-cache/redis`     | Redis adapter (via ioredis)      |
| `@express-route-cache/memcached` | Memcached adapter (via memjs)    |

## API

### `createCache(config)`

| Option      | Type          | Default  | Description                                |
| ----------- | ------------- | -------- | ------------------------------------------ |
| `adapter`   | `CacheClient` | —        | **Required**. Cache adapter instance       |
| `staleTime` | `number`      | `60`     | Seconds data is considered fresh           |
| `gcTime`    | `number`      | `300`    | Seconds stale data is kept before eviction |
| `swr`       | `boolean`     | `false`  | Serve stale data while revalidating        |
| `stampede`  | `boolean`     | `true`   | Coalesce concurrent requests               |
| `vary`      | `string[]`    | `[]`     | Request headers to segment cache by        |
| `keyPrefix` | `string`      | `"erc:"` | Key namespace prefix                       |
| `enabled`   | `boolean`     | `true`   | Enable/disable caching                     |

Returns: `{ middleware(), route(opts?), invalidate(...patterns), invalidateRoute(...patterns), adapter }`

### `cache.route(opts?)`

Per-route override. Accepts: `staleTime`, `gcTime`, `swr`, `enabled`, `vary`, `key`.

### `cache.invalidate(...patterns)`

Express middleware that increments epoch counters for the given route patterns.

### `cache.invalidateRoute(...patterns)`

Programmatic invalidation — call from services, cron jobs, webhooks.

## Adapters

### Memory (built-in)

```ts
import { createMemoryAdapter } from "@express-route-cache/core";
const adapter = createMemoryAdapter(600); // default TTL 600s
```

### Redis

```ts
import { createRedisAdapter } from "@express-route-cache/redis";
const adapter = createRedisAdapter({ url: "redis://localhost:6379" });
// Or: createRedisAdapter({ client: existingIoredisInstance })
```

### Memcached

```ts
import { createMemcachedAdapter } from "@express-route-cache/memcached";
const adapter = createMemcachedAdapter({ servers: "localhost:11211" });
```

### Custom Adapter

Implement the `CacheClient` interface:

```ts
interface CacheClient {
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  incr(key: string): Promise<number>;
  disconnect?(): Promise<void>;
}
```

## Response Headers

| Header          | Value               | Meaning                                 |
| --------------- | ------------------- | --------------------------------------- |
| `X-Cache`       | `HIT`               | Fresh data from cache                   |
| `X-Cache`       | `STALE`             | Stale data (SWR revalidation triggered) |
| `X-Cache`       | `MISS`              | Fresh data from handler                 |
| `Age`           | seconds             | How old the cached response is          |
| `Cache-Control` | `public, max-age=N` | Remaining freshness window              |

## License

MIT
