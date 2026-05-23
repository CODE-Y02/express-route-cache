---
title: "Testing | @express-route-cache"
description: "How to write unit and integration tests for routes that use @express-route-cache, including adapter mocking and cache bypass strategies."
---

# Testing

Testing code that uses a cache requires a strategy. Caching can make tests flaky (a test passes because it hits a stale entry) or slow (cache misses trigger real I/O). This guide covers the right patterns for both unit and integration testing.

## Strategy 1: Disable the Cache in Tests (Recommended for Unit Tests)

The simplest approach. Set `enabled: false` when `NODE_ENV=test`. The middleware calls `next()` immediately without touching the adapter.

```ts
// cache.ts — your shared cache instance
import { createCache, createMemoryAdapter } from '@express-route-cache/core';

export const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60,
  gcTime: 300,
  enabled: process.env.NODE_ENV !== 'test', // ← disabled in tests
});
```

Now your route handlers execute directly in every test — no cache side-effects, no ordering dependencies between test cases.

---

## Strategy 2: Use the Memory Adapter (Recommended for Integration Tests)

For integration tests where you want to verify caching behaviour (e.g., "second request returns a HIT"), use the in-process Memory adapter. It's fast, isolated to the test process, and resets when the process exits.

```ts
import request from 'supertest';
import express from 'express';
import { createCache, createMemoryAdapter } from '@express-route-cache/core';

function buildApp() {
  const app = express();
  const cache = createCache({
    adapter: createMemoryAdapter(),
    staleTime: 60,
  });

  app.get('/api/users', cache.route(), (_req, res) => {
    res.json([{ id: 1, name: 'Alice' }]);
  });

  return app;
}

test('second request returns a cache HIT', async () => {
  const app = buildApp();

  const first = await request(app).get('/api/users');
  expect(first.status).toBe(200);
  expect(first.headers['x-cache']).toBe('MISS');

  const second = await request(app).get('/api/users');
  expect(second.status).toBe(200);
  expect(second.headers['x-cache']).toBe('HIT');
});
```

> [!TIP]
> Create a fresh `buildApp()` per test (or per describe block) to guarantee a clean cache state. Each call creates a new in-process Memory adapter with zero entries.

---

## Strategy 3: Mock the Adapter (Unit Testing Cache Logic)

To test your own cache-aware service layer — without a real adapter or Express — inject a mock `CacheClient`. The interface only requires 5 methods (`get`, `mget`, `set`, `del`, `incr`).

```ts
import { vi } from 'vitest'; // or jest.fn()
import type { CacheClient } from '@express-route-cache/core';
import { createCache } from '@express-route-cache/core';

const mockAdapter: CacheClient = {
  get: vi.fn().mockResolvedValue(null),          // Always MISS
  mget: vi.fn().mockResolvedValue([null]),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  incr: vi.fn().mockResolvedValue(1),
};

const cache = createCache({ adapter: mockAdapter, staleTime: 60 });

test('cache.fetch() calls set() on MISS', async () => {
  const result = await cache.fetch('key', () => Promise.resolve({ ok: true }));

  expect(result).toEqual({ ok: true });
  expect(mockAdapter.set).toHaveBeenCalledOnce();
  expect(mockAdapter.set).toHaveBeenCalledWith(
    'erc:key',            // keyPrefix + key
    expect.any(String),   // JSON payload
    60,                   // totalTTL (staleTime + gcTime = 60 + 300 = 360)
  );
});
```

---

## Asserting Cache Headers

The middleware sets the `X-Cache` header on every response:

| `X-Cache` value | Meaning |
| :--- | :--- |
| `MISS` | First request — handler executed, response now cached |
| `HIT` | Served from cache (within `staleTime`) |
| `STALE` | Served stale data — background revalidation triggered |

Use these in integration tests to assert your caching logic is working:

```ts
test('invalidation clears the cache', async () => {
  const app = buildApp(); // fresh cache

  await request(app).get('/api/posts');                      // MISS — populates cache
  await request(app).post('/api/posts').send({ title: 'x' }); // triggers invalidation

  const after = await request(app).get('/api/posts');
  expect(after.headers['x-cache']).toBe('MISS');            // cache was cleared ✅
});
```

---

## Testing `invalidateRoute()`

```ts
test('programmatic invalidation causes next request to MISS', async () => {
  const app = express();
  const cache = createCache({ adapter: createMemoryAdapter(), staleTime: 60 });

  app.get('/api/items', cache.route(), (_req, res) => res.json([1, 2, 3]));

  await request(app).get('/api/items'); // populate

  // Invalidate programmatically
  await cache.invalidateRoute('/api/items');

  const after = await request(app).get('/api/items');
  expect(after.headers['x-cache']).toBe('MISS'); // ✅
});
```

---

## Testing SWR Behaviour

SWR requires time to elapse. Control time in tests using `vi.useFakeTimers()` / `jest.useFakeTimers()`:

```ts
test('SWR returns STALE and triggers background refresh', async () => {
  vi.useFakeTimers();

  const app = express();
  const cache = createCache({
    adapter: createMemoryAdapter(),
    staleTime: 30,  // 30s fresh
    gcTime: 3600,   // keep stale for 1h
    swr: true,
  });

  let callCount = 0;
  app.get('/api/data', cache.route(), (_req, res) => {
    callCount++;
    res.json({ n: callCount });
  });

  await request(app).get('/api/data'); // MISS — callCount = 1
  expect(callCount).toBe(1);

  // Fast-forward past staleTime
  vi.advanceTimersByTime(31_000);

  const stale = await request(app).get('/api/data');
  expect(stale.headers['x-cache']).toBe('STALE'); // served stale instantly
  // Background revalidation has been fired (callCount will be 2 after it settles)

  vi.useRealTimers();
});
```

---

## Recommended Test Setup Summary

| Scenario | Strategy |
| :--- | :--- |
| Unit tests for route handlers | `enabled: false` via env variable |
| Integration: verify HIT/MISS/STALE | Fresh `createMemoryAdapter()` per test |
| Unit tests for cache-aware services | Mock `CacheClient` with `vi.fn()` |
| Time-sensitive SWR / TTL tests | `vi.useFakeTimers()` |
| Redis integration tests (CI) | Real Redis via `REDIS_URL` env variable |
