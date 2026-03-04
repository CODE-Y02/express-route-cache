# @express-route-cache/core

> **TanStack Query for the backend** — Production-grade, drop-in route caching for Express.js with O(1) invalidation.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@express-route-cache/core.svg)](https://www.npmjs.com/package/@express-route-cache/core)

`@express-route-cache/core` provides a high-performance, flexible caching layer for Express.js applications. Inspired by the developer experience of TanStack Query, it brings features like **Stale-While-Revalidate (SWR)**, **Stampede Protection**, and **O(1) Invalidation** to your server-side routes.

## Key Features

- 🧮 **O(1) Epoch Invalidation**: Invalidate entire route trees instantly without expensive key scanning.
- ⚡ **Server-Side SWR**: Serve stale data instantly while revalidating the cache in the background.
- 🔒 **Stampede Protection**: Coalesce concurrent requests for the same key to a single handler execution.
- 🔌 **Adapter Based**: Use the built-in memory adapter or plug in Redis/Memcached.
- TypeScript First: Full type safety for configuration and custom keys.

## Installation

```bash
npm install @express-route-cache/core
```

## Basic Usage

```ts
import express from "express";
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const app = express();

// 1. Create the cache instance
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60, // Fresh for 60s
  gcTime: 300, // Keep stale for 300s
  swr: true, // Revalidate in background
});

// 2. Use as global middleware (caches all GET routes)
app.use(cache.middleware());

// 3. Or use per-route with overrides
app.get("/api/data", cache.route({ staleTime: 10 }), (req, res) => {
  res.json({ date: new Date() });
});

// 4. Invalidate specific trees
app.post("/api/update", cache.invalidate("/api/data"), (req, res) => {
  res.json({ updated: true });
});
```

## Core Concepts

### Cache Freshness (TanStack-style)

We use a two-tier timing model:

1.  **`staleTime`**: The duration (in seconds) that data is considered "fresh". During this time, the cache returns the value instantly without checking anything.
2.  **`gcTime`**: The duration (in seconds) that data remains in the cache after it becomes stale.

If `swr` (Stale-While-Revalidate) is enabled:

- **Fresh**: Instant HIT.
- **Stale**: Instant HIT (returns stale data) + Background revalidation triggers.
- **Expired**: MISS (handler runs, then cache updates).

### O(1) Invalidation

Most Express caching libraries use `Set`s to track keys, making invalidation O(N). We use **Epoch Versioning**.
Every route pattern has an associated "epoch" counter. Cache keys incorporate these versions:

`erc:GET:/users/123|v:/users=5|v:/users/:id=2`

To invalidate `/users`, we simply increment its epoch. All future requests for `/users/*` will naturally generate new keys, effectively "expiring" the old ones instantly (O(1)).

## API Reference

### `createCache(config)`

| Option      | Type          | Default | Description                                        |
| ----------- | ------------- | ------- | -------------------------------------------------- |
| `adapter`   | `CacheClient` | —       | **Required**. Memory, Redis, or Memcached adapter. |
| `staleTime` | `number`      | `60`    | Seconds data stays fresh.                          |
| `gcTime`    | `number`      | `300`   | Seconds stale data stays in cache.                 |
| `swr`       | `boolean`     | `false` | Enable background revalidation.                    |
| `stampede`  | `boolean`     | `true`  | Prevent "thundering herd" by coalescing requests.  |
| `vary`      | `string[]`    | `[]`    | Headers to include in cache key (e.g. `['auth']`). |
| `enabled`   | `boolean`     | `true`  | Toggle caching globally.                           |

## Adapters

- **Memory**: Included (`createMemoryAdapter`).
- **Redis**: `@express-route-cache/redis`
- **Memcached**: `@express-route-cache/memcached`

## License

MIT
