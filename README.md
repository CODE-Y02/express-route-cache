<div align="center">
  <h1>⚡ @express-route-cache</h1>
  <p><strong>TanStack Query for the Backend</strong></p>
  <p>Production-grade, drop-in route caching for Express.js with O(1) invalidation, SWR, and Stampede Protection.</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/@express-route-cache/core.svg)](https://www.npmjs.com/package/@express-route-cache/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/CODE-Y02/express-route-cache/actions/workflows/release.yml/badge.svg)](https://github.com/CODE-Y02/express-route-cache/actions)

</div>

<hr />

### 😭 The Problem with Express Caching

Every existing Express caching middleware (`apicache`, `route-cache`, `cache-express`) shares the same fatal production pain-points:

- ❌ **O(N) Invalidation:** When a user updates their profile, traditional libraries have to `SCAN` the entire Redis instance to find and delete all keys that match `/users/123/*`. This hangs the Node event loop and brings down databases.
- ❌ **No Stale-While-Revalidate (SWR):** Cache expires -> next user waits 300ms for a fresh database pull.
- ❌ **Thundering Herds:** A viral post expires from the cache. 1,000 requests hit Express. Your database gets 1,000 identical queries simultaneously and melts.

### 🚀 The Solution

Meet `@express-route-cache`. We brought the modern conveniences of frontend data-fetching (like TanStack/React Query) to your backend Express APIs.

| Feature                    | Existing Packages | This Library                                           |
| -------------------------- | ----------------- | ------------------------------------------------------ |
| **Invalidation**           | ❌ `SCAN` / `DEL` | ✅ **O(1) Epoch `INCR`** (Instant, zero blocking)      |
| **Stale-While-Revalidate** | ❌                | ✅ **Instant Stale Delivery** + Background Refresh     |
| **Stampede Protection**    | ❌                | ✅ **Request Coalescing** (1,000 reqs = 1 DB call)     |
| **Adapters**               | ❌ Locked to one  | ✅ **Memory, Redis (ioredis), Memcached (memjs)**      |
| **Binary Support**         | ❌ JSON only      | ✅ **Automatic** (Images, PDFs, Buffers)               |
| **Header Preservation**    | ❌ Stripped       | ✅ **Automatic** (CORS, Custom Headers)                |
| **DX**                     | ❌ Callbacks      | ✅ **Modern API** (`staleTime`, `autoInvalidate`)      |

---

## 📦 Installation

```bash
# Core package (includes Memory adapter out of the box)
npm install @express-route-cache/core

# Want distributed caching? Add an adapter:
npm install @express-route-cache/redis ioredis
npm install @express-route-cache/memcached memjs
```

## 🛠️ Quick Start

```ts
import express from "express";
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const app = express();

// 1. Initialize the Cache
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60, // Fresh for 60 seconds (Instant HIT)
  gcTime: 300, // Kept stale for 5 more minutes
  swr: true, // Enable Stale-While-Revalidate!
});

// 2. Cache globally (Only caches GET requests automatically)
app.use(cache.middleware());

// 3. Or override per-route
app.get("/users/:id", cache.route({ staleTime: 120 }), getUser);

// 4. Invalidate instantly upon mutation (POST/PUT/DELETE)
app.post("/users", cache.invalidate("/users"), createUser);
```

---

## 🧠 Core Concepts

### 1. Fresh vs Stale (TanStack-Inspired)

We use a two-tier timing model:

1. **`staleTime`**: The duration data is considered "fresh". The cache returns the value instantly.
2. **`gcTime`**: The duration data remains in the cache _after_ it becomes stale.

If `swr: true` is enabled:

- **Fresh**: ⚡ Instant HIT.
- **Stale**: 🔄 Instant HIT (returns stale data) + Background revalidation triggers automatically.
- **Expired/Evicted**: ⏳ MISS (handler runs, updates cache).

### 2. O(1) Epoch Invalidation

Instead of slow `Set` key tracking, we use **Epoch Versioning**. Every route pattern has a tiny numeric counter in the cache.
When you cache `/users/123`, the key looks like this: `erc:GET:/users/123|v:/users=5|v:/users/:id=2`.

To invalidate the entire `/users` tree, we simply increment the `/users` counter to `6`. All future requests generate brand new keys, immediately abandoning the old data. It requires zero key scanning.

### 3. Stampede Protection

If 5,000 users request `/viral-post` at the exact same millisecond the cache expires, `@express-route-cache` steps in. It holds the 4,999 connection promises in memory and executes your Express handler exactly **one** time. Once the database returns the data, all 5,000 connections are resolved simultaneously.

> 📚 **Deep Dive:** Want to know _why_ we didn't use Redis distributed locks? Or how exactly the `INCR` command guarantees O(1) performance? Read our [Architecture & Trade-offs](./ARCHITECTURE.md) document for detailed diagrams.

---

## 📖 API Reference

### `createCache(config)`

| Option      | Type          | Default | Description                                                        |
| ----------- | ------------- | ------- | ------------------------------------------------------------------ |
| `adapter`   | `CacheClient` | —       | **Required**. Memory, Redis, or Memcached adapter.                 |
| `staleTime` | `number`      | `60`    | Seconds data stays fresh.                                          |
| `gcTime`    | `number`      | `300`   | Seconds stale data stays in cache.                                 |
| `swr`       | `boolean`     | `false` | Enable background revalidation.                                    |
| `stampede`  | `boolean`     | `true`  | Prevent "thundering herd" by coalescing requests.                  |
| `vary`      | `string[]`    | `[]`    | Headers to namespace caches (e.g. `['authorization']`).            |
| `sortQuery` | `boolean`     | `false` | Sort query params deterministically (`?a=1&b=2` equals `?b=2&a=1`) |
| `maxBodySize`| `number`     | `2097152` | Max response body size in bytes to cache (default: 2MB). Prevents memory leaks. |
| `autoInvalidate`| `boolean`   | `false` | Automatically invalidate route patterns on successful `POST/PUT/DELETE`. |
| `enabled`   | `boolean`     | `true`  | Toggle caching globally.                                           |

Returns `{ middleware(), route(), invalidate(), invalidateRoute(), adapter }`.

### `cache.route(opts)`

Per-route middleware. Accepts all configuration options (like `staleTime`) as overrides for a specific endpoint.

### `cache.invalidate(...routePatterns)`

Express middleware to invalidate particular routes.
`app.post('/article', cache.invalidate('/articles'), handler)`

### `cache.invalidateRoute(...routePatterns)`

Programmatic invalidation for use inside services, cron jobs, or webhooks.
`await cache.invalidateRoute('/users/123');`

---

## 🔌 Adapters

### Memory (Built-in)

For single-process apps and local development.

```ts
import { createMemoryAdapter } from "@express-route-cache/core";
const adapter = createMemoryAdapter(600); // Default strict TTL fallback: 600s
```

### Redis (`@express-route-cache/redis`)

Highly recommended for production.

```ts
import { createRedisAdapter } from "@express-route-cache/redis";

// Connect via URL
const adapter = createRedisAdapter({ url: "redis://localhost:6379" });

// OR reuse your existing application client safely (we won't double-close it!)
const adapter = createRedisAdapter({ client: myGlobalIoredisClient });
```

### Memcached (`@express-route-cache/memcached`)

Perfect for high-throughput, pure KV caching.

```ts
import { createMemcachedAdapter } from "@express-route-cache/memcached";
const adapter = createMemcachedAdapter({ servers: "localhost:11211" });
```

---

## 🔍 HTTP Headers

We automatically append headers for CDN and debugging visibility:

- `X-Cache`: `HIT` | `MISS` | `STALE`
- `Age`: How many seconds old the data is.
- `Cache-Control`: Respects your `staleTime` (e.g. `public, max-age=60`). **Note:** If your handler sets its own `Cache-Control` (e.g., `private`), this library respects it and won't overwrite it.

---

## 🛠️ Advanced Features

### Binary Data Support
Unlike most Express caching libraries that only handle JSON strings, `@express-route-cache` supports binary responses out of the box. You can cache images, PDFs, and ZIP files without corruption.

### Smart Invalidation
Invalidation (via `cache.invalidate()` or `autoInvalidate: true`) is **post-response**. This means we only increment the route version if your handler finishes successfully (2xx). This prevents "Cache Zombies" where stale data is re-cached due to race conditions during database updates.

---

## 🚀 Release Channels & Versioning

This project uses an automated CI/CD pipeline (via [Changesets](https://github.com/changesets/changesets)) to manage NPM distributions directly from GitHub branches. 

Depending on your stability needs, you can install from different channels using NPM `dist-tags`:

| Channel | NPM Tag | Command | GitHub Branch | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Stable** | `@latest` | `npm i @express-route-cache/core@latest` | `main` | Production-ready. This is the default. |
| **Beta/RC** | `@next` | `npm i @express-route-cache/core@next` | `next` | Cutting-edge features currently in development. |
| **Legacy** | `@vX.Y-lts` | `npm i @express-route-cache/core@v0.1-lts` | `v*` (e.g., `v0.1`) | Old architectural versions maintained solely for critical security/hotfix patches. |

### For Contributors & Maintainers
If you are contributing to this project or managing releases, please read our [Contributing Guide](CONTRIBUTING.md#release-channels--versioning) to understand how we use the `main`, `next`, and `v*` branches to automatically deploy updates to NPM.

---

## 👨‍💻 Author

Created and maintained by **Yatharth Lakhate**.
If you have questions, feedback, or need to report a vulnerability privately, you can reach me directly:

- **LinkedIn**: [Yatharth Lakhate](https://www.linkedin.com/in/yatharth-lakhate/)
- **X (Twitter)**: [@Yatharth_L](https://x.com/Yatharth_L)

---

## License

MIT
