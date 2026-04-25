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

app.listen(3000);
```

## Key Concepts

### Two-Tier Timing

We use two timers to manage your data lifecycle:

1. **`staleTime`**: Data is "fresh". Returned instantly.
2. **`gcTime`**: Data is "stale". If `swr` is enabled, returned instantly while refreshing in the background.

### Invalidation

Invalidation is **O(1)**. Instead of searching for keys to delete, we use "Epoch Versioning". Incrementing a version number makes all old cache entries instantly obsolete.
