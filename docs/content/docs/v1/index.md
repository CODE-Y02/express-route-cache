---
title: Legacy Documentation (v1)
description: Caching middleware for Express.js - Version 1.x
---

# Legacy Documentation (v1.x)

Welcome to the documentation for **Version 1.x** of `@express-route-cache`.

> [!WARNING]
> This documentation is for the legacy version of `@express-route-cache`. For the latest features (including the standalone `cache.fetch` API, Cache Studio, and improved performance), please check out the [Latest Version (v2.x)](/docs/guide/why).

---

### 🚀 Key Features of v1.x

- **O(1) Invalidation**: Instant cache invalidation using Epoch Versioning.
- **Stale-While-Revalidate**: Serve stale data instantly while refreshing in the background.
- **Stampede Protection**: Request coalescing prevents concurrent cache misses from overloading your database.
- **Multi-Adapter**: Support for Memory, Redis (ioredis), and Memcached.

To get started, follow the [v1 Getting Started Guide](/docs/v1/guide/getting-started).
