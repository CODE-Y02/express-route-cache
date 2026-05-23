---
title: "Stale-While-Revalidate (SWR) | @express-route-cache"
description: "Learn how SWR keeps your API responses instant by refreshing cache in the background, with distributed lock support."
---

# Stale-While-Revalidate (SWR)

Latency spikes are the enemy of a great user experience. `@express-route-cache` uses SWR to ensure your users never wait for a database refresh.

## The Problem Without SWR

Without SWR, every user whose request arrives at the exact moment a cache entry expires pays the full cost of your database query:

```
Timeline without SWR:

t=0     First request → MISS (200ms DB query) → cache entry created
t=60s   Cache expires (staleTime reached)
t=60s   Next user → MISS (200ms DB query again) 😬 latency spike!
```

## How SWR Fixes It

When a request arrives for a **stale** entry (older than `staleTime` but younger than `staleTime + gcTime`):

1. **Instant HIT**: The server immediately serves the stale data from the cache (`X-Cache: STALE`).
2. **Two-Tier Lock Acquisition**: Before firing the background refresh, the library acquires a lock to prevent multiple concurrent revalidations.
3. **Background Refresh**: The server re-runs your Express handler using a mock request/response pair.
4. **Cache Update**: Once the handler returns fresh data, the cache is updated for the next request.

```
Timeline with SWR:

t=0     First request → MISS (200ms DB query) → cache entry created
t=60s   Cache goes stale (staleTime reached)
t=60s   Next user → STALE served instantly (0ms!) + background refresh fires
t=60.2s Background refresh completes → cache has fresh data again
t=120s  Next expiry → same pattern, zero latency for users
```

## The `staleTime` / `gcTime` Window

```
|←── staleTime (fresh) ──→|←── gcTime (stale) ──→|← expired →|
0s                        60s                    360s
                          ↑                      ↑
                     SWR kicks in           Evicted from cache
                     (serves stale,         (full MISS on next
                      refreshes in bg)       request)
```

| Window | Behaviour |
| :--- | :--- |
| `0 → staleTime` | `X-Cache: HIT` — fresh, served instantly |
| `staleTime → staleTime+gcTime` | `X-Cache: STALE` — served instantly + background refresh (SWR must be `true`) |
| `> staleTime+gcTime` | `X-Cache: MISS` — expired, handler executes, user waits |

## Two-Tier SWR Lock

To prevent multiple servers or multiple in-process requests from all firing a background revalidation for the same key at the same time:

**Tier 1 — Distributed lock (`setNX`)**: When your adapter supports `setNX` (Redis, Memcached), only **one server across the entire cluster** acquires the SWR revalidation lock. The lock TTL equals `max(10, staleTime)` seconds.

**Tier 2 — Local lock (in-process Set)**: For adapters without `setNX` (e.g. Memory), a per-process `Set` prevents the same server from double-firing a revalidation within the same process.

Once the background revalidation completes (or fails), the lock is released so future stale hits can trigger the next refresh cycle.

## Enabling SWR

SWR is disabled by default. Enable it globally or per-route:

```ts
// Global — all cached routes use SWR
const cache = createCache({
  swr: true,
  staleTime: 60,   // Fresh for 60s
  gcTime: 3600,    // Kept stale for 1 hour (SWR window = 60s–3600s)
});

// Per-route override
app.get('/slow-report', cache.route({ swr: true, staleTime: 300 }), handler);

// Disable per-route even if enabled globally
app.get('/real-time-feed', cache.route({ swr: false }), handler);
```

## Benefits

- **Zero latency spikes** — users always get an instant response, even on a stale entry.
- **Resilience** — if your database is temporarily slow, stale data continues serving while retries happen in the background.
- **Cluster-safe** — with Redis or Memcached, the distributed SWR lock ensures exactly one revalidation fires per stale window across all your servers.

## Troubleshooting SWR

If a background revalidation fails (e.g. your route handler throws), the library logs:

```
[@express-route-cache] SWR background revalidation failed. Check your route handler for errors.
```

Common causes:
- An unhandled `async` rejection inside the route handler.
- A missing database connection or service dependency.
- Middleware that inspects `req.socket` and throws when it detects the mock background request object.

The stale entry continues to be served until the next successful revalidation.
