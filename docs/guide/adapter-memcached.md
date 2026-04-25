---
title: "Memcached Adapter | @express-route-cache"
description: "Distributed caching using Memcached (memjs) for low-latency production environments."
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
