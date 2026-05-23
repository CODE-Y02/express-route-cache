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

- **Storage**: When caching `/users/123`, we include the current epoch of `/users` in the cache key hash.
- **Invalidation**: To invalidate all `/users/*` routes, we simply increment the epoch of `/users`.
- **Result**: All existing cache entries for `/users` instantly become "ghosts" — they still exist in the cache store but will never be queried again because the application is now computing a different key hash with the higher epoch version. Old entries expire naturally via `gcTime`.

## Usage

### Manual Invalidation

```ts
// Increment epoch for /users — O(1) INCR operation
await cache.invalidateRoute('/users');

// Invalidate multiple patterns at once
await cache.invalidateRoute('/api/users', '/api/posts');
```

### Middleware Invalidation

```ts
// Automatically invalidate after a successful POST
app.post('/users', cache.invalidate('/users'), createUser);
```

### Auto Invalidation

Set `autoInvalidate: true` to automatically increment epochs for the current route pattern when a successful `POST`, `PUT`, `PATCH`, or `DELETE` request occurs on a route:

```ts
const cache = createCache({ autoInvalidate: true });

// Or per-route:
app.post('/users', cache.route({ autoInvalidate: true }), createUser);
```

> [!NOTE]
> `autoInvalidate` triggers on any non-GET method that returns a 2xx status code, including `PATCH` — not just `POST`, `PUT`, and `DELETE`.

> [!CAUTION]
> When a custom `key` override is set on the same route (e.g. `cache.route({ key: 'my-key', autoInvalidate: true })`), `autoInvalidate` **has no effect** and is silently skipped. This is because custom keys bypass route pattern detection — there is no epoch to increment. Use `cache.invalidate()` middleware or `cache.invalidateRoute()` programmatically instead:
> ```ts
> app.post('/users', cache.invalidate('/users'), cache.route({ key: 'my-key' }), createUser);
> ```
