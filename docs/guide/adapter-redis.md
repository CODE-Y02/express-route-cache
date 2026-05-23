---
title: "Redis Adapter | @express-route-cache"
description: "Distributed caching using Redis (ioredis) for multi-instance production environments."
---

# Redis Adapter

The Redis adapter is the recommended choice for production environments. It allows multiple server instances to share the same cache and persist data across restarts.

## Installation

```bash
npm install @express-route-cache/redis ioredis
```

## Setup

```ts
import { createCache } from "@express-route-cache/core";
import { createRedisAdapter } from "@express-route-cache/redis";

// Option 1: Connect via URL
const adapter = createRedisAdapter({ url: "redis://localhost:6379" });

// Option 2: Use full ioredis options
const adapter = createRedisAdapter({
  options: { host: "127.0.0.1", port: 6379, password: "secret" },
});

// Option 3: Reuse an existing ioredis client
const adapter = createRedisAdapter({ client: myExistingClient });

const cache = createCache({ adapter, keyPrefix: "my-app:" });
```

## Adapter Options (`createRedisAdapter`)

| Option | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | Redis connection URL (e.g. `redis://localhost:6379`). |
| `options` | `RedisOptions` | Raw `ioredis` options object (alternative to `url`). |
| `client` | `Redis` | An existing `ioredis` instance to reuse. |

> [!NOTE]
> The cache key prefix (default `"erc:"`) is configured on `createCache({ keyPrefix })`, not on the adapter.

## Performance

This adapter uses native Redis `MGET` and `INCR` commands for O(1) performance, and `SCAN` (cursor-based) for safe key enumeration in Cache Studio. It is highly optimized for high-throughput Express applications.
