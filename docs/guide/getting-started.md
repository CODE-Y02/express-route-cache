---
title: Getting Started | @express-route-cache
description: Learn how to set up production-grade route caching for Express.js in less than a minute.
---

# Getting Started

## Installation

Install the core package along with any adapters you need:

```bash
# Core package (includes Memory adapter)
npm install @express-route-cache/core

# Redis adapter
npm install @express-route-cache/redis ioredis

# Memcached adapter
npm install @express-route-cache/memcached memjs
```

## Quick Start

Setting up `@express-route-cache` takes less than a minute.

```ts
import express from "express";
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const app = express();

// 1. Initialize the Cache
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60, // Fresh for 60 seconds
  gcTime: 300,   // Kept stale for 5 more minutes
  swr: true,     // Enable Stale-While-Revalidate
});

// 2. Cache globally (GET requests only)
app.use(cache.middleware());

// 3. Or override per-route
app.get("/users/:id", cache.route({ staleTime: 120 }), (req, res) => {
  res.json({ id: req.params.id, name: "John Doe" });
});

// 4. Invalidate instantly upon mutation
app.post("/users", cache.invalidate("/users"), (req, res) => {
  // logic to create user...
  res.status(201).json({ success: true });
});

// 5. Manual Data Caching (Standalone Fetch)
const data = await cache.fetch('users-list', async () => {
  return [{ id: 1, name: 'John' }];
}, { swr: true, retry: 3 });

app.listen(3000);
```

## Key Concepts

### Invalidation

Invalidation is **O(1)**. Instead of searching for keys to delete, we use "Epoch Versioning". Incrementing a version number makes all old cache entries instantly obsolete.

## 🛠️ Advanced Patterns

### 1. Custom Cache Keys
Sometimes `req.path` isn't enough. You can override the key manually:
```ts
// Static key
cache.route({ key: 'my-custom-key' });

// Dynamic key based on request (e.g., user-specific)
cache.route({ key: (req) => `user-${req.user.id}-profile` });
```

### 2. Header-based Caching (`vary`)
If your API returns different data based on headers (like `Authorization` or `Accept-Language`), use the `vary` option:
```ts
cache.route({ vary: ['Authorization', 'Accept-Language'] });
```

### 3. Query Parameter Determinism
Avoid cache fragmentation by sorting query parameters:
```ts
// ?b=2&a=1 will be treated the same as ?a=1&b=2
cache.route({ sortQuery: true });
```

### 4. Automatic Invalidation
You can tell the cache to automatically increment the version for a route pattern whenever a successful `POST`, `PUT`, or `DELETE` request is made:
```ts
// Globally
const cache = createCache({ autoInvalidate: true, ... });

// Or per-route
app.post('/users', cache.route({ autoInvalidate: true }), createUser);
```

### 5. Memory Protection (`maxBodySize`)
To prevent large responses (like 500MB videos) from crashing your Node process or filling up Redis, use `maxBodySize`. Any response larger than this will simply skip the cache.
```ts
cache.route({ maxBodySize: 1024 * 1024 * 5 }); // 5MB limit
```
