---
title: "Standalone Fetch | @express-route-cache"
description: "Use cache.fetch() for manual data caching with SWR, Stampede Protection, and exponential backoff retries — not just for Express routes."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/cache-fetch
  - - meta
    - property: og:title
      content: "Standalone Fetch | @express-route-cache"
  - - meta
    - property: og:description
      content: "Use cache.fetch() for manual data caching with SWR, Stampede Protection, and exponential backoff retries — not just for Express routes."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/cache-fetch
---

# Standalone Fetch

`cache.fetch()` lets you cache arbitrary async data — database queries, external API calls, file reads — with the same SWR, Stampede Protection, and Retry features used by route middleware.

Use it anywhere in your codebase: service layers, resolvers, cron jobs, or tRPC procedures.

## Basic Usage

```ts
import { createCache, createMemoryAdapter } from '@express-route-cache/core';

const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60,
  gcTime: 300,
});

// In a service / route handler
const users = await cache.fetch('all-users', () => db.users.findMany());
```

On the first call, the fetcher runs and the result is cached. Subsequent calls within `staleTime` return the cached value instantly without calling the fetcher.

## With SWR (Background Refresh)

```ts
const users = await cache.fetch(
  'all-users',
  () => db.users.findMany(),
  { staleTime: 60, gcTime: 3600, swr: true }
);
```

When the entry is stale (older than `staleTime` but younger than `staleTime + gcTime`), the cached value is returned immediately and the fetcher re-runs in the background to refresh the cache for the next caller.

## With Retry (Exponential Backoff)

```ts
const data = await cache.fetch(
  'external-api',
  () => fetch('https://api.example.com/data').then(r => r.json()),
  { retry: 3 } // 3 retries; waits 200ms, 400ms, 800ms before each retry attempt
);
```

If the fetcher throws, it is automatically retried up to `retry` times with exponential backoff (`200ms × 2ⁱ` where `i` = retry index starting at 0). If all retries are exhausted, the last error is re-thrown.

## Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `staleTime` | `number` | global `staleTime` | Seconds data stays fresh. |
| `gcTime` | `number` | global `gcTime` | Seconds stale data is kept in cache. |
| `swr` | `boolean` | global `swr` | Enable background revalidation on stale hit. |
| `enabled` | `boolean` | global `enabled` | Set to `false` to bypass caching for this call. |
| `maxBodySize` | `number` | global `maxBodySize` | Max serialized payload size in bytes. |
| `retry` | `number` | global `retry` | Number of retry attempts on fetcher failure. |

> [!NOTE]
> Options `key`, `autoInvalidate`, `vary`, and `sortQuery` are not available on `cache.fetch()` — they are specific to route-based middleware.

## Key Behavior

The `key` you pass is automatically prefixed with `keyPrefix` (default `"erc:"`) if it doesn't already start with it. You don't need to add the prefix manually.

```ts
// These are equivalent:
await cache.fetch('users', fetcher);
await cache.fetch('erc:users', fetcher);
```

## Stampede Protection

`cache.fetch()` coalesces concurrent calls with the same key **within a single process**. If two calls arrive simultaneously in the same Node.js process during a cache miss, only one fetcher executes — the other waits for the same in-flight Promise.

```ts
// Within a single process, only 1 DB query fires despite concurrent callers
const [a, b, c] = await Promise.all([
  cache.fetch('top-products', fetchFromDB),
  cache.fetch('top-products', fetchFromDB),
  cache.fetch('top-products', fetchFromDB),
]);
```

> [!WARNING]
> `cache.fetch()` stampede protection is **in-process only**. Unlike route middleware (which uses a distributed `setNX` lock when using Redis/Memcached), two different server instances can both fire the fetcher simultaneously for the same key. For cross-server deduplication, add a distributed lock at the application layer or use the route middleware instead.

## Binary / Buffer Data

`cache.fetch()` supports `Buffer` return values. Buffers are base64-encoded for storage and decoded back on retrieval.

```ts
const imageBuffer = await cache.fetch(
  'logo-png',
  () => fs.promises.readFile('./logo.png'),
  { staleTime: 3600 }
);
// imageBuffer is a Buffer
```

## Full Example: Service Layer

```ts
// user.service.ts
import { cache } from './cache'; // your shared cache instance

export async function getUser(id: string) {
  return cache.fetch(`user:${id}`, () => db.users.findById(id), {
    staleTime: 120,
    gcTime: 600,
    swr: true,
    retry: 2,
  });
}

export async function updateUser(id: string, data: Partial<User>) {
  const result = await db.users.update(id, data);
  // Invalidate the user's cached entry programmatically
  await cache.invalidateRoute(`/api/users/${id}`);
  return result;
}
```
