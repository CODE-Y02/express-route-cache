---
title: "Frequently Asked Questions | @express-route-cache"
description: "Answers to the most common questions about express-route-cache: how invalidation works, Redis support, SWR, stampede protection, TypeScript types, and more."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/faq
  - - meta
    - property: og:title
      content: "FAQ | @express-route-cache"
  - - meta
    - property: og:description
      content: "Common questions about express-route-cache: O(1) invalidation, Redis, SWR, stampede protection, TypeScript support, and production deployment."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/faq
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is @express-route-cache?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "@express-route-cache is a production-grade caching middleware for Express.js. It provides O(1) route invalidation via Epoch Versioning, Stale-While-Revalidate (SWR) background refresh, and Stampede Protection via request coalescing. It supports Redis (ioredis), Memcached (memjs), and in-memory adapters."
            }
          },
          {
            "@type": "Question",
            "name": "How is express-route-cache different from other Express caching libraries?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most Express caching middleware (like apicache or express-cache-controller) use Redis SCAN or KEYS to invalidate groups of keys, which is O(N) and blocks your event loop. express-route-cache uses Epoch Versioning for true O(1) invalidation, supports SWR background refresh, and prevents cache stampedes via request coalescing — features not found in simpler alternatives."
            }
          },
          {
            "@type": "Question",
            "name": "Does express-route-cache work with TypeScript?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. The entire library is written in TypeScript and ships with full type definitions. All configuration options, adapter interfaces, and middleware overrides are fully typed."
            }
          },
          {
            "@type": "Question",
            "name": "Is express-route-cache production-ready?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. It is designed for high-throughput distributed environments. Key production features include: O(1) invalidation that scales to millions of keys, Redis adapter for shared cache across multiple instances, Stampede Protection to prevent thundering herds, and memory protection via maxBodySize limits."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use express-route-cache without Redis?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. The built-in Memory adapter (included in @express-route-cache/core) requires no external dependencies. It is ideal for local development or single-instance deployments. For production with multiple Node.js instances, use the Redis or Memcached adapter."
            }
          },
          {
            "@type": "Question",
            "name": "What is the difference between staleTime and gcTime?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "staleTime is how long a cache entry is considered 'fresh' (served immediately without revalidation). gcTime is how long a stale entry stays in the cache before being evicted. If SWR is enabled, entries between staleTime and gcTime are served instantly but trigger a background refresh."
            }
          }
        ]
      }
---

# Frequently Asked Questions

## General

### What is `@express-route-cache`?

`@express-route-cache` is a production-grade caching middleware for Express.js. It adds three critical features that most Express caching solutions lack:

1. **O(1) Invalidation** via Epoch Versioning — no Redis `SCAN`, no `KEYS` command
2. **Stale-While-Revalidate (SWR)** — serve instantly, refresh in background
3. **Stampede Protection** — request coalescing prevents thundering herds

It supports **Redis** (ioredis), **Memcached** (memjs), and **in-memory** storage adapters.

---

### How is it different from `apicache` or `express-cache-controller`?

| Feature | `@express-route-cache` | `apicache` | `express-cache-controller` |
| :--- | :---: | :---: | :---: |
| O(1) Invalidation | ✅ | ❌ (SCAN) | ❌ |
| SWR Background Refresh | ✅ | ❌ | ❌ |
| Stampede Protection | ✅ | ❌ | ❌ |
| Redis Support | ✅ | ✅ | ❌ |
| Memcached Support | ✅ | ❌ | ❌ |
| Binary Data (images) | ✅ | ❌ | ❌ |
| TypeScript-first | ✅ | ❌ | ❌ |

See the [full comparison →](./comparison)

---

### Does it work with TypeScript?

Yes. The library is written entirely in TypeScript and ships with full type definitions. No `@types/` packages needed.

---

### Is it production-ready?

Yes. It is designed for high-throughput distributed environments:

- **Scales to millions of keys** — O(1) invalidation never degrades
- **Multi-instance safe** — Redis adapter shares cache across all pods
- **Memory-safe** — `maxBodySize` prevents OOM from large responses
- **Resilient** — Stampede protection means no thundering herd on deploys

---

## Configuration

### What is the difference between `staleTime` and `gcTime`?

This mirrors TanStack Query's naming convention:

- **`staleTime`** — How long a response is considered "fresh". During this period, all requests are served from cache without any background work.
- **`gcTime`** — How long a stale response stays in the cache. When SWR is enabled, responses in the `staleTime → gcTime` window are served instantly and trigger a background refresh.

```ts
createCache({
  staleTime: 60,  // Fresh for 60s — zero DB calls
  gcTime: 3600,   // Stays cached for 1 hour (stale)
  swr: true,      // Serve stale, refresh in background
});
```

---

### Can I disable caching for specific routes?

Yes, use `enabled: false` per-route:

```ts
app.get('/health', cache.route({ enabled: false }), handler);
```

Or toggle globally:

```ts
const cache = createCache({ enabled: process.env.NODE_ENV !== 'test' });
```

---

### How do I cache user-specific data?

Use the `vary` option to namespace the cache per user, or a custom `key` function:

```ts
// Vary by Authorization header (one cache entry per token)
cache.route({ vary: ['Authorization'] });

// Or use a fully custom key
cache.route({ key: (req) => `user:${req.user.id}:profile` });
```

---

## Invalidation

### How does O(1) cache invalidation work?

Each route pattern (e.g., `/api/posts`) has an integer "epoch" counter stored alongside the cache. When you call `cache.invalidate('/api/posts')`:

1. The epoch for `/api/posts` is incremented (a single `INCR` command in Redis).
2. All future requests look for cache keys containing the **new** epoch.
3. Old entries still exist in Redis but are never queried — they expire naturally via TTL.

No `SCAN`, no `KEYS`, no blocking operations. O(1) regardless of how many cached entries exist.

---

### Does invalidation work across multiple server instances?

Yes, when using the **Redis** adapter. All instances share the same Redis epoch counters and cache store, so invalidating on one instance immediately affects all others.

---

### What triggers `autoInvalidate`?

When `autoInvalidate: true` is set, the library automatically increments the epoch for the matching route pattern after any successful **`POST`**, **`PUT`**, **`PATCH`**, or **`DELETE`** request (i.e., `2xx` response).

---

## Performance

### Does caching affect my event loop?

No. All cache reads and writes are async. The in-memory adapter uses a simple `Map` with zero blocking calls. The Redis and Memcached adapters use async network calls that do not block the Node.js event loop.

---

### What happens if Redis goes down?

If the Redis adapter fails to connect or throws an error, the request falls through to your Express handler as a cache MISS — the cache is skipped gracefully and your application continues to function normally.

---

## Licensing

### Is `@express-route-cache` free?

Yes. It is 100% free and open source under the **MIT License**.
[View on GitHub →](https://github.com/CODE-Y02/express-route-cache)
