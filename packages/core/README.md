<div align="center">
  <h1>⚡ @express-route-cache/core</h1>
  <p><strong>TanStack Query for the Backend</strong></p>
  <p>Production-grade, drop-in route caching for Express.js with O(1) invalidation, SWR, and Stampede Protection.</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/@express-route-cache/core.svg)](https://www.npmjs.com/package/@express-route-cache/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

### 🚀 The Core Engine

This package contains the main caching logic and the built-in **Memory Adapter**. It is designed to be highly performant, type-safe, and compatible with both small and large-scale Express applications.

| Feature                    | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| **Invalidation**           | ✅ **O(1) Epoch `INCR`** (Instant, zero blocking)      |
| **Stale-While-Revalidate** | ✅ **Instant Stale Delivery** + Background Refresh     |
| **Stampede Protection**    | ✅ **Request Coalescing** (1,000 reqs = 1 DB call)     |
| **Standalone Fetch**       | ✅ **`cache.fetch()`** (Manual data caching)           |
| **Retries**                | ✅ **Exponential Backoff** (Built-in)                  |
| **Binary Support**         | ✅ **Automatic** (Images, PDFs, Buffers)               |
| **Header Preservation**    | ✅ **Automatic** (CORS, Custom Headers)                |

---

## 📦 Installation

```bash
npm install @express-route-cache/core
```

## 🛠️ Usage

```ts
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60,
  swr: true,
});

// Middleware
app.get("/api/data", cache.route(), handler);

// Standalone Fetch
const data = await cache.fetch('custom-key', () => fetchData(), { retry: 3 });
```

## 📖 API Reference

### `createCache(config)`

| Option      | Type          | Default | Description                                                        |
| ----------- | ------------- | ------- | ------------------------------------------------------------------ |
| `adapter`   | `CacheClient` | —       | **Required**. Memory, Redis, or Memcached adapter.                 |
| `staleTime` | `number`      | `60`    | Seconds data stays fresh.                                          |
| `gcTime`    | `number`      | `300`   | Seconds stale data stays in cache.                                 |
| `swr`       | `boolean`     | `false` | Enable background revalidation.                                    |
| `stampede`  | `boolean`     | `true`  | Prevent "thundering herd" by coalescing requests.                  |
| `retry`     | `number`      | `0`     | Number of retries for failed fetches.                              |
| `keyPrefix` | `string`      | `"erc:"`| Prefix for all cache keys.                                         |
| `vary`      | `string[]`    | `[]`    | Headers to namespace caches.                                       |
| `autoInvalidate`| `boolean` | `false` | Auto-invalidate on POST/PUT/DELETE.                                |

### `cache.fetch(key, fetcher, opts)`

Standalone method for manual data caching. Includes full SWR, Stampede Protection, and Retries.

```ts
const data = await cache.fetch('my-key', async () => {
  return await db.users.findMany();
}, { staleTime: 60, swr: true, retry: 3 });
```

## 🔍 In-Depth
For a full comparison with TanStack Query and deep dives into the architecture, visit our [Main Documentation](https://github.com/CODE-Y02/express-route-cache).

## License
MIT
