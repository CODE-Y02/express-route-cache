---
title: "Adapters | @express-route-cache"
description: "Choose the right storage adapter for your Express caching needs—Memory, Redis, or Memcached."
---

# Adapters

`@express-route-cache` is adapter-agnostic. You can swap storage engines depending on your production environment.

## Available Adapters

| Adapter | Best For | Requirement |
| :--- | :--- | :--- |
| [**Memory**](./adapter-memory) | Local dev / Single-instance | None (Built-in) |
| [**Redis**](./adapter-redis) | Production / Distributed | `ioredis` |
| [**Memcached**](./adapter-memcached) | Production / Distributed | `memjs` |

## Which one should I choose?

- **Use Memory** if you are running a single Node.js process and don't need the cache to persist between restarts.
- **Use Redis** (Recommended) for most production apps. it allows multiple server instances to share the same cache and is extremely fast.
- **Use Memcached** if your infrastructure already uses it or if you only need simple key-value caching without complex data structures.

## Creating a Custom Adapter

You can build your own adapter by implementing the `CacheClient` interface. See the [API Reference](../reference/api#cacheclient-interface) for details.
