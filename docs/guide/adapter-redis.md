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

// Option 2: Use an existing ioredis client
const adapter = createRedisAdapter({ client: myExistingClient });

const cache = createCache({ adapter });
```

## Options

The `createRedisAdapter` function accepts either a `url` string or an options object:

| Option | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | Redis connection URL. |
| `client` | `Redis` | An existing `ioredis` instance. |
| `keyPrefix` | `string` | Prefix for all cache keys (default: `erc:`). |

## Performance

This adapter uses Redis `MGET` and `INCR` for O(1) performance. It is highly optimized for high-throughput Express applications.
