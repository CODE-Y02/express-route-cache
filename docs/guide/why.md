---
title: "Why express-route-cache? | @express-route-cache"
description: "Understand what makes @express-route-cache different from other Express caching solutions, and why it was built."
---

# Why `@express-route-cache`?

There are several Express caching libraries. Here's why this one exists and what makes it different.

## The Core Problem with Existing Libraries

Most Express caching libraries solve the easy part (storing a response) but fail on the hard part: **invalidation**.

### Common approaches and their problems

**`apicache`** and similar libraries often invalidate by calling `KEYS` or `SCAN` on Redis to find and delete matching keys. This is an **O(N)** operation — it gets slower as your cache grows. At 1M keys, invalidation can block your Redis instance for seconds.

**In-process memory caches** are simple but break the moment you deploy more than one server instance. Two pods behind a load balancer will have two completely separate caches, creating inconsistencies.

**Manual `res.setHeader('Cache-Control', ...)`** only controls browser caching — it doesn't cache on your server at all.

**None of these handle the thundering herd.** When a cached entry expires and 500 concurrent requests arrive simultaneously, all 500 hit your database at once.

---

## What `@express-route-cache` Does Differently

### 1. O(1) Invalidation — Always

Instead of scanning keys, we use **Epoch Versioning**. Every route pattern has an integer counter. Invalidating `/api/users` is a single `INCR` command — O(1) regardless of how many keys you have.

```ts
// This is one Redis INCR, no matter how many /api/users/* entries exist
await cache.invalidateRoute('/api/users');
```

### 2. Stampede Protection Built In

The thundering herd problem is solved at two levels simultaneously:

- **Distributed** (Redis/Memcached): `SETNX` elects one leader server. Others poll and wait.
- **In-process**: An LRU map coalesces concurrent requests within the same Node.js process.

No configuration required — it works by default.

### 3. Stale-While-Revalidate (SWR)

Borrowed from browser caching and popularized by TanStack Query. Stale data is served instantly while fresh data is fetched in the background — users never wait for a cache refresh.

### 4. Not Just Route Middleware

`cache.fetch()` brings the same SWR + Stampede + Retry system to any async data — service layers, cron jobs, tRPC resolvers — not just Express routes.

### 5. Binary-Safe

Images, PDFs, and ZIPs are stored as Base64 and decoded perfectly on retrieval. No response type requires special handling.

---

## Feature Comparison

| Feature | `@express-route-cache` | `apicache` | `route-cache` |
| :--- | :---: | :---: | :---: |
| O(1) invalidation | ✅ | ❌ (SCAN) | ❌ |
| Stale-While-Revalidate | ✅ | ❌ | ❌ |
| Stampede / thundering herd protection | ✅ | ❌ | ❌ |
| Distributed (Redis / Memcached) | ✅ | ✅ | ❌ |
| Binary support (images, PDFs) | ✅ | ✅ | ❌ |
| Visual dashboard (Cache Studio) | ✅ | ❌ | ❌ |
| TypeScript-first | ✅ | ❌ | ❌ |
| Custom adapter interface | ✅ | ❌ | ❌ |
| `cache.fetch()` (non-route caching) | ✅ | ❌ | ❌ |

> [!NOTE]
> This comparison reflects publicly documented features. Other libraries are actively maintained and may be the right choice for simpler use cases.

---

## When Should You Use This Library?

**Great fit if you:**
- Have multiple server instances behind a load balancer
- Need to invalidate cache on mutations (POST/PUT/PATCH/DELETE)
- Want sub-millisecond responses even for stale data
- Have high-traffic endpoints that risk thundering herd
- Need to cache non-JSON responses (images, PDFs)
- Want a visual dashboard for your cache

**May be overkill if you:**
- Have a single-instance app with simple TTL-based caching needs
- Don't need invalidation at all (pure time-based expiry is fine)
- Are already deeply invested in a specific caching solution

---

## Design Inspiration

The API is deliberately inspired by **TanStack Query** — the best-in-class client-side data fetching library. `staleTime`, `gcTime`, and `swr` will feel immediately familiar if you've used it. The goal is to bring the same mental model to the server.
