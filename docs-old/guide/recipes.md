---
title: "Recipes | @express-route-cache"
description: "Real-world caching patterns: per-user caching, cache warming, webhook invalidation, conditional caching, multi-tenant setups, and more."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/recipes
  - - meta
    - property: og:title
      content: "Recipes | @express-route-cache"
  - - meta
    - property: og:description
      content: "Real-world caching patterns: per-user caching, cache warming, webhook invalidation, conditional caching, multi-tenant setups, and more."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/recipes
---

# Recipes

Copy-paste patterns for common real-world scenarios.

---

## Per-User Caching

Cache different responses per user by including the `Authorization` header in the cache key. Users with different tokens get their own private cache entries.

```ts
const cache = createCache({
  adapter: createRedisAdapter({ url: process.env.REDIS_URL }),
  vary: ["authorization"], // Cache key includes the Authorization header value
  staleTime: 120,
});

app.get("/api/profile", cache.route(), async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  res.json(user);
});
```

> [!TIP]
> The `vary` option works at the key-hash level — two requests with different `Authorization` values produce different SHA-256 cache keys. No security risk of cross-contamination.

---

## Multi-Tenant Caching

Isolate cache entries per tenant using a custom tenant header:

```ts
const cache = createCache({
  adapter: createRedisAdapter({ url: process.env.REDIS_URL }),
  vary: ["x-tenant-id"],
  staleTime: 60,
});

app.get("/api/dashboard", cache.route(), async (req, res) => {
  const tenantId = req.headers["x-tenant-id"];
  const data = await getDashboardData(tenantId);
  res.json(data);
});
```

---

## Query Parameter Determinism

Prevent cache fragmentation when clients send the same parameters in different orders:

```ts
// ?sort=name&page=1 and ?page=1&sort=name both hit the same cache entry
app.get("/api/products", cache.route({ sortQuery: true }), handler);
```

---

## Custom Key for User-Specific Routes

Use a dynamic key function when your cache key needs to incorporate data beyond headers or query params:

```ts
app.get(
  "/api/users/:id/dashboard",
  cache.route({
    key: (req) => `user-dashboard:${req.params.id}`,
    staleTime: 300,
    swr: true,
  }),
  handler,
);
```

> [!CAUTION]
> When using a custom `key`, `autoInvalidate` has no effect. Use `cache.invalidate()` or `cache.invalidateRoute()` for invalidation instead.

---

## Conditional Caching (Skip for Certain Requests)

Pre-create the cache middleware, then decide per-request whether to apply it:

```ts
const cachedRoute = cache.route({ staleTime: 60 });

app.get(
  "/api/feed",
  (req, res, next) => {
    // Bypass cache for admin users who always need fresh data
    if (req.headers["x-admin-bypass"] === "true") {
      return next(); // Goes straight to the handler below
    }
    return cachedRoute(req, res, next);
  },
  async (req, res) => {
    const feed = await getFeed();
    res.json(feed);
  },
);
```

---

## Cache Warming on Startup

Pre-populate the cache with frequently-accessed data before your server starts accepting traffic. This prevents cold-start latency spikes on the first requests.

```ts
import { cache } from "./cache";
import { getTopProducts, getConfig } from "./services";

async function warmCache() {
  console.log("Warming cache...");

  await Promise.all([
    cache.fetch("top-products", () => getTopProducts(), { staleTime: 300 }),
    cache.fetch("app-config", () => getConfig(), { staleTime: 3600 }),
  ]);

  console.log("Cache warm ✅");
}

async function start() {
  await warmCache();
  app.listen(3000, () => console.log("Server ready"));
}

start();
```

---

## Webhook-Triggered Invalidation

Invalidate the cache from a webhook (e.g., a CMS publish event, a Stripe webhook) without needing an active HTTP request:

```ts
import { cache } from "./cache";

// Contentful / Sanity webhook: content published
app.post("/webhooks/content", express.json(), async (req, res) => {
  const { contentType, slug } = req.body;

  // Invalidate the affected routes
  await cache.invalidateRoute(
    `/api/content/${contentType}`,
    `/api/content/${contentType}/${slug}`,
  );

  res.json({ invalidated: true });
});
```

---

## Service Layer Caching with SWR and Retry

Wrap your database calls with `cache.fetch()` in the service layer — keeping your routes clean and your data fresh:

```ts
// posts.service.ts
import { cache } from "./cache";
import { db } from "./db";

export async function getPost(id: string) {
  return cache.fetch(`post:${id}`, () => db.posts.findById(id), {
    staleTime: 120,
    gcTime: 3600,
    swr: true,
    retry: 2,
  });
}

export async function updatePost(id: string, data: Partial<Post>) {
  const result = await db.posts.update(id, data);

  // Invalidate the post and the list
  await cache.invalidateRoute(`/api/posts/${id}`, "/api/posts");

  return result;
}
```

---

## Cascading Invalidation

`invalidateRoute` accepts multiple patterns at once. Invalidate parent and child routes in a single O(1) call per pattern:

```ts
// When a comment is posted, invalidate: the comment list AND the post (which shows comment count)
app.post(
  "/api/posts/:postId/comments",
  cache.invalidate(`/api/posts/:postId/comments`, `/api/posts/:postId`),
  createComment,
);
```

---

## Protecting Slow Aggregation Endpoints

For endpoints that aggregate across many tables (expensive to recompute), use a long `staleTime` with SWR so users never wait:

```ts
app.get(
  "/api/analytics/summary",
  cache.route({
    staleTime: 300, // Fresh for 5 minutes
    gcTime: 86400, // Keep stale for 24 hours
    swr: true, // Serve stale instantly while recomputing in background
  }),
  async (_req, res) => {
    const summary = await db.query(`
      SELECT COUNT(*) as users, SUM(revenue) as total
      FROM ...
    `);
    res.json(summary);
  },
);
```

---

## Memory Protection for Large File Endpoints

Skip caching for responses that exceed a size limit to protect your Node.js heap:

```ts
app.get(
  "/api/exports/:id",
  cache.route({
    maxBodySize: 512 * 1024, // Only cache responses up to 512KB
    staleTime: 3600,
  }),
  generateExport,
);
```

Responses larger than `maxBodySize` are served normally — the cache is silently skipped, no error is thrown.

---

## Exposing Cache Metrics in Your Monitoring Stack

Push `cache.metrics` to your metrics system (Prometheus, Datadog, etc.) on an interval:

```ts
import { cache } from "./cache";

// Push to your metrics collector every 30 seconds
setInterval(() => {
  const m = cache.metrics;
  if (!m) return;

  metrics.gauge("cache.hits", m.hits);
  metrics.gauge("cache.misses", m.misses);
  metrics.gauge("cache.swr_hits", m.swrHits);
  metrics.gauge("cache.swr_failures", m.swrFailures);
  metrics.gauge("cache.stampede_coalesces", m.stampedeCoalesces);
}, 30_000);
```
