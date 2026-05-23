---
title: "O(1) Epoch Cache Invalidation | @express-route-cache"
description: "How express-route-cache achieves O(1) cache invalidation using Epoch Versioning — no Redis SCAN, no KEYS command. Instantly invalidate any route pattern in production."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/concepts-invalidation
  - - meta
    - property: og:title
      content: "O(1) Cache Invalidation in Express.js | @express-route-cache"
  - - meta
    - property: og:description
      content: "Instantly invalidate Express.js route cache using Epoch Versioning. O(1) performance — no Redis SCAN or KEYS. Scales to millions of cached entries."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/concepts-invalidation
---

# Epoch Invalidation

Invalidating cached data is notoriously difficult. Most libraries struggle with performance when deleting many keys at once.

## The O(1) Solution

`@express-route-cache` uses **Epoch Versioning**. Every route pattern (e.g., `/users`) has a version number (an "epoch") stored in the cache.

- **Storage**: When caching `/users/123`, we include the current epoch of `/users` in the key.
- **Invalidation**: To invalidate all `/users/*` routes, we simply increment the epoch of `/users`.
- **Result**: All existing cache keys for `/users` instantly become "ghosts"—they still exist in the database but will never be queried again because the application is now looking for a higher epoch version.

## Usage

### Manual Invalidation

```ts
// Increment epoch for /users
await cache.invalidateRoute('/users');
```

### Middleware Invalidation

```ts
app.post('/users', cache.invalidate('/users'), createUser);
```

### Auto Invalidation

Set `autoInvalidate: true` to automatically increment epochs for matching patterns when a successful `POST`, `PUT`, or `DELETE` request occurs on a route.

```ts
const cache = createCache({ autoInvalidate: true });
```
