---
title: "Architecture & Design | @express-route-cache"
description: "A deep dive into the design decisions, O(1) invalidation strategy, two-tier stampede protection, and the SWR implementation."
---

# Architecture & Design

This page explains the core architectural choices and trade-offs made in `@express-route-cache`.

## 1. O(1) Epoch Invalidation

Traditional cache middlewares map a URL directly to a cache key. To invalidate a group of keys (e.g., all posts), they often use slow `SCAN` or `KEYS` commands in Redis — O(N) operations that block the event loop.

**Our Solution:** We assign an integer "epoch" counter to every route pattern. This epoch is embedded into the cache key hash. To invalidate, we simply call `INCR` on the epoch. All future requests generate new keys, making old ones instantly obsolete — no scanning, no deleting.

Key structure:
```
{prefix}hash:{sha256 of: method:url?queryHash|v:/api=0|v:/api/users=3|vary:auth=...}
```

When epoch `v:/api/users` increments from `3` to `4`, all previously cached keys for `/api/users/*` produce a different SHA-256 hash and are never looked up again. They expire naturally via `gcTime`.

## 2. Two-Tier Stampede Protection

When a popular cache entry expires, hundreds of concurrent requests might hit your database at once — the "Thundering Herd."

**Our Solution:** A **two-tier request coalescing** system:

**Tier 1 — Distributed (Redis/Memcached):** Uses `SETNX` to elect one server as the leader. Only the leader executes the handler. All other servers poll the cache at 150ms intervals (up to 10 polls ≈ 1.5s) and serve the result once the leader populates it.

**Tier 2 — In-Process:** An LRU map (`inflightRequests`, max 5,000 entries) stores in-flight Promises. Concurrent requests within the same process await the existing Promise instead of spawning new handler executions.

Both tiers are active simultaneously when using Redis or Memcached. Only Tier 2 is active for the Memory adapter.

## 3. Stale-While-Revalidate (SWR)

Latency spikes occur when a user hits an expired cache and has to wait for a database refresh.

**Our Solution:** If `swr` is enabled and data is within its `gcTime`, we serve the stale data to the user immediately and close the connection. Then, a background revalidation re-runs the route handler using a mock request/response pair (isolated from the original socket) and writes the fresh result to the cache.

A **two-tier SWR lock** (distributed `setNX` + local `Set`) ensures that only one revalidation fires per stale window across the entire cluster.

## 4. Header Preservation

Most libraries only cache the JSON body and lose critical headers like CORS, Content-Type, or custom app metadata.

**Our Solution:** We capture the full response state using `res.getHeaders()` at the moment the response is finalized. When serving a cache HIT, we replay all headers (except `Set-Cookie` and `X-Express-*` internal headers) to ensure a perfect, high-fidelity response.

## 5. Binary Support

Standard caching libraries often corrupt binary data (images, PDFs) by treating them as UTF-8 strings.

**Our Solution:** We use a Base64 serialization layer. All response bodies are encoded to Base64 for storage (the `isBase64: true` flag is stored in the cache entry) and decoded back to `Buffer` upon retrieval, supporting any binary response out of the box.

## 6. Safe Key Hashing

Storing raw URLs as cache keys (e.g. `erc:GET:/api/users/123?filter=active|v:/api=0|vary:auth=Bearer+...`) can result in very long strings that exceed Redis/Memcached key length limits.

**Our Solution:** The full logical key is SHA-256 hashed and stored as `{prefix}hash:{hex}`. This guarantees a fixed-length, safe key regardless of URL complexity, vary headers, or query string size.
