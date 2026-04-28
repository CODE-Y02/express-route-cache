---
title: "In-Memory Cache Adapter | @express-route-cache"
description: "High-performance in-memory caching for single-process Express.js applications and local development. Built into @express-route-cache/core, zero dependencies."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/adapter-memory
  - - meta
    - property: og:title
      content: "In-Memory Cache Adapter for Express.js | @express-route-cache"
  - - meta
    - property: og:description
      content: "Built-in memory adapter for Express.js caching. Zero extra dependencies, ideal for local dev and single-instance apps."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/adapter-memory
---

# Memory Adapter

The Memory adapter is built into `@express-route-cache/core` and is perfect for single-process applications or local development.

## Setup

```ts
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const cache = createCache({
  adapter: createMemoryAdapter(),
});
```

## Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fallbackTTL` | `number` | `600` | Strict TTL in seconds to prevent memory leaks if items are never accessed. |

## Limitations

- **Process Local**: Cache is not shared between multiple Node.js instances (e.g., in a cluster or Kubernetes).
- **Volatile**: Cache is cleared whenever the server restarts.
