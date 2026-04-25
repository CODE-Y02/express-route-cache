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
