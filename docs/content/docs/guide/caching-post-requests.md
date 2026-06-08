---
title: "Caching POST Requests | @express-route-cache"
description: "How to safely cache POST and non-GET requests using explicit enabling, custom keys, and the type-safe generateCacheKey helper."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/caching-post-requests
  - - meta
    - property: og:title
      content: "Caching POST Requests | @express-route-cache"
  - - meta
    - property: og:description
      content: "Learn how to cache POST, PUT, and other mutation requests safely using explicit route configuration, custom keys, and the type-safe generateCacheKey utility."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/caching-post-requests
---

# Caching POST Requests

By default, `@express-route-cache` only caches `GET` requests. Standard mutation HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) bypass the caching layer entirely and trigger auto-invalidation instead. This prevents accidental caching of destructive actions (e.g. creating a user or making a purchase).

However, some endpoints use `POST` for read-only or idempotent operations, such as:

1. **Search APIs** where the query parameters/filter payloads are too large to fit in a standard `GET` URL limit.
2. **GraphQL APIs** which route all queries and mutations via `POST` requests.

This guide explains how to safely enable and configure caching for these routes.

---

## 1. Enabling Caching for non-GET Requests

To cache a `POST` request, you must explicitly enable it at the route level. The global configuration default `enabled: true` only applies to `GET` requests.

You can set `enabled: true` or pass a dynamic function `(req, res) => boolean`:

```ts
// 1. Enable caching unconditionally for this POST route
app.post("/api/search", cache.route({ enabled: true }), handler);

// 2. Enable caching dynamically based on headers or query parameters
app.post(
  "/api/query",
  cache.route({
    enabled: (req) => req.headers["x-skip-cache"] !== "true",
  }),
  handler,
);
```

---

## 2. Setting a Custom Cache Key

> [!WARNING]
> **CRITICAL**: The default key generator in `@express-route-cache` does **not** parse or incorporate the request body (`req.body`).
> If you enable `POST` caching without specifying a custom `key`, all `POST` requests to that URL will share the same cache entry, regardless of what query or body is sent.

To differentiate between different `POST` bodies, you must provide a custom `key` generator that incorporates the body payload.

### The `generateCacheKey` Helper

We expose a type-safe generic utility function called `generateCacheKey` to make hashing custom bodies and tags easy:

```ts
import { generateCacheKey } from "@express-route-cache/core";

// Signature:
// generateCacheKey<T>(tag: string, data: T, prefix?: string): string;
```

Inside your route options, pass a `key` resolver using `generateCacheKey`:

```ts
import { generateCacheKey } from "@express-route-cache/core";

app.post(
  "/api/search",
  cache.route({
    enabled: true,
    // data is req.body (generic T). We pass "" as the prefix
    // so that cache.route can prepend the global prefix (e.g., "erc:")
    key: (req) => generateCacheKey("search", req.body, ""),
  }),
  async (req, res) => {
    const results = await performSearch(req.body);
    res.json(results);
  },
);
```

### Hashing URL + Body

If you want the key to be unique to both the specific URL path and the body contents:

```ts
app.post(
  "/api/graphql",
  cache.route({
    enabled: true,
    key: (req) => {
      const uniquenessPayload = {
        path: req.originalUrl || req.url,
        body: req.body,
      };
      return generateCacheKey("graphql", uniquenessPayload, "");
    },
  }),
  graphqlHandler,
);
```

---

## 3. Dynamic Cache Control (Function Callbacks)

You can specify a function callback for the `enabled` parameter. This allows you to skip or allow caching based on the request state (e.g. bypass caching for logged-in users, or only cache requests containing specific parameters).

```ts
app.post(
  "/api/reports",
  cache.route({
    enabled: (req) => {
      // Only cache search requests that look for public data
      return req.body.visibility === "public";
    },
    key: (req) => generateCacheKey("reports", req.body, ""),
    staleTime: 300,
  }),
  reportsHandler,
);
```

---

## Summary Checklist for POST Caching

1. Set `enabled: true` (or a callback function) on the route middleware.
2. Specify the `key` option using `generateCacheKey` to hash the request body.
3. Pass `""` (empty string) as the third parameter to `generateCacheKey` to let the cache middleware handle global prefixing cleanly.
