---
title: "Memcached Cache Adapter (memjs) | @express-route-cache"
description: "Set up Express.js route caching with Memcached using memjs. Fast, simple key-value caching for production environments that already use Memcached."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/adapter-memcached
  - - meta
    - property: og:title
      content: "Memcached Adapter for Express.js Caching | @express-route-cache"
  - - meta
    - property: og:description
      content: "Add Memcached-backed route caching to Express.js with memjs. Simple, fast, and production-ready."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/adapter-memcached
---

# Memcached Adapter

The Memcached adapter is ideal for high-performance key-value caching where complex data structures are not required.

## Installation

```bash
npm install @express-route-cache/memcached memjs
```

## Setup

```ts
import { createCache } from "@express-route-cache/core";
import { createMemcachedAdapter } from "@express-route-cache/memcached";

const adapter = createMemcachedAdapter({ servers: "localhost:11211" });

const cache = createCache({ adapter });
```

## Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `servers` | `string` | Memcached server address (e.g., `localhost:11211`). |
| `keyPrefix` | `string` | Prefix for all cache keys (default: `erc:`). |

## Performance

Memcached is known for its extreme speed and simplicity. This adapter is a great alternative to Redis for pure caching workloads.
