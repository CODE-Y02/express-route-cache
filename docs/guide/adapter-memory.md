---
title: "Memory Adapter | @express-route-cache"
description: "High-performance in-memory caching for single-instance applications."
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
