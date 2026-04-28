---
title: "Stampede Protection & Thundering Herd Prevention | @express-route-cache"
description: "How express-route-cache prevents the cache stampede (thundering herd) problem using request coalescing. Stop N concurrent DB queries on a cache miss."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/concepts-stampede
  - - meta
    - property: og:title
      content: "Cache Stampede Protection for Express.js | @express-route-cache"
  - - meta
    - property: og:description
      content: "Prevent the thundering herd problem in Express.js with request coalescing. One DB query, N waiting requests resolved simultaneously."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/concepts-stampede
---

# Stampede Protection

A "Cache Stampede" occurs when a popular cache entry expires and hundreds of concurrent requests hit the database simultaneously to refresh it.

## Request Coalescing

`@express-route-cache` prevents this by "coalescing" requests at the process level.

1. **First Request**: Hits a cache MISS. It starts executing the Express handler and stores a **Promise** in memory.
2. **Subsequent Requests**: If they arrive while the first request is still processing, they **await the existing Promise** instead of starting a new handler execution.
3. **Completion**: Once the first request finishes, all waiting requests resolve with the same data simultaneously.

## Configuration

Stampede protection is **enabled by default**. You can toggle it if needed:

```ts
const cache = createCache({
  stampede: true, // Default
});
```
