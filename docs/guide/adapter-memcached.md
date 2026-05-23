---
title: "Memcached Adapter | @express-route-cache"
description: "Distributed caching using Memcached (memjs) for low-latency production environments."
---

# Memcached Adapter

The Memcached adapter is ideal for high-performance key-value caching where complex data structures are not required. Memcached is multi-threaded (unlike Redis) and excels at pure cache workloads.

## Installation

```bash
npm install @express-route-cache/memcached memjs
```

## Setup

```ts
import { createCache } from "@express-route-cache/core";
import { createMemcachedAdapter } from "@express-route-cache/memcached";

// Single server
const adapter = createMemcachedAdapter({ servers: "localhost:11211" });

// Multiple servers (comma-separated)
const adapter = createMemcachedAdapter({ servers: "server1:11211,server2:11211" });

// Reuse an existing memjs client
const adapter = createMemcachedAdapter({ client: myExistingClient });

const cache = createCache({ adapter, keyPrefix: "my-app:" });
```

## Adapter Options (`createMemcachedAdapter`)

| Option | Type | Description |
| :--- | :--- | :--- |
| `servers` | `string` | Comma-separated Memcached server(s). Defaults to `"localhost:11211"`. |
| `client` | `memjs.Client` | An existing `memjs` client instance to reuse. |
| `options` | `Record<string, unknown>` | Additional raw `memjs` client options. |

> [!NOTE]
> The cache key prefix (default `"erc:"`) is configured on `createCache({ keyPrefix })`, not on the adapter.

> [!WARNING]
> Memcached does not support key enumeration. The `keys()` method always returns an empty array, so Cache Studio's key browser will show no entries when using this adapter.

## Performance

Memcached is known for its extreme speed and simplicity. This adapter uses only basic KV + `INCR` operations — no Set operations are required, keeping the adapter fully Memcached-compatible.
