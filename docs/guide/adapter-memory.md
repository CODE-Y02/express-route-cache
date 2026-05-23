---
title: "Memory Adapter | @express-route-cache"
description: "High-performance in-memory caching for single-instance applications."
---

# Memory Adapter

The Memory adapter is built into `@express-route-cache/core` — no extra installation needed. It is perfect for single-process applications, local development, and testing.

## Setup

```ts
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

// Default: entries expire after 600 seconds if no explicit TTL is set
const cache = createCache({
  adapter: createMemoryAdapter(),
});

// Custom default TTL
const cache = createCache({
  adapter: createMemoryAdapter(3600), // entries default to 1 hour
});
```

## Signature

```ts
createMemoryAdapter(defaultTTLSeconds?: number): CacheClient
```

| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `defaultTTLSeconds` | `number` | `600` | Maximum TTL (seconds) for entries stored without an explicit TTL. Prevents unbounded memory growth. |

## Limitations

- **Process Local**: Cache is not shared between multiple Node.js instances (e.g., in a cluster or behind a load balancer).
- **Volatile**: Cache is cleared whenever the server restarts.

For multi-instance or persistent caching, use the [Redis](./adapter-redis) or [Memcached](./adapter-memcached) adapter instead.
