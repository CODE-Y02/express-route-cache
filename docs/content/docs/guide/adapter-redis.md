---
title: "Redis Cache Adapter (ioredis) | @express-route-cache"
description: "Set up distributed Express.js route caching with Redis using ioredis. Supports URL connection, existing client reuse, and key prefixing. Recommended for production."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/adapter-redis
  - - meta
    - property: og:title
      content: "Redis Cache Adapter for Express.js | @express-route-cache"
  - - meta
    - property: og:description
      content: "Use Redis with ioredis for distributed Express.js caching. O(1) performance with MGET and INCR. Supports multiple server instances."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/adapter-redis
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

| Option    | Type           | Description                                           |
| :-------- | :------------- | :---------------------------------------------------- |
| `url`     | `string`       | Redis connection URL (e.g. `redis://localhost:6379`). |
| `options` | `RedisOptions` | Raw `ioredis` options object (alternative to `url`).  |
| `client`  | `Redis`        | An existing `ioredis` instance to reuse.              |

> [!NOTE]
> The cache key prefix (default `"erc:"`) is configured on `createCache({ keyPrefix })`, not on the adapter.

---

## Redis Cluster Adapter

If you are running in a distributed environment with a Redis Cluster topology (such as AWS ElastiCache Cluster or custom sharded setups), use `createRedisClusterAdapter`.

It automatically manages keys across multiple nodes, pipelines `DEL` calls to handle cross-slot limitations safely, and queries master nodes individually during `keys()` lookups.

### Setup

```ts
import { createCache } from "@express-route-cache/core";
import { createRedisClusterAdapter } from "@express-route-cache/redis";

const adapter = createRedisClusterAdapter({
  nodes: [
    { host: "10.0.0.1", port: 6379 },
    { host: "10.0.0.2", port: 6379 },
  ],
  options: {
    scaleReads: "slave", // scale reads to replicas
  },
});

const cache = createCache({ adapter });
```

### Adapter Options (`createRedisClusterAdapter`)

| Option    | Type             | Description                                                                     |
| :-------- | :--------------- | :------------------------------------------------------------------------------ |
| `nodes`   | `ClusterNode[]`  | **Required**. List of seed cluster nodes.                                       |
| `options` | `ClusterOptions` | Raw `ioredis` ClusterOptions configuration.                                     |
| `client`  | `Cluster`        | An existing `ioredis.Cluster` instance to reuse (alternative to seeding nodes). |

---

## Performance

This adapter uses native Redis `MGET` and `INCR` commands for O(1) performance, and `SCAN` (cursor-based) for safe key enumeration in Cache Studio. It is highly optimized for high-throughput Express applications.
