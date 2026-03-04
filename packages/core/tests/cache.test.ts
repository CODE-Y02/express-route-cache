import { describe, it, expect, beforeAll } from "vitest";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { createCache, createMemoryAdapter } from "../src/index";

// ─── Test Helpers ───────────────────────────────────────────────────────────

function createTestApp(cacheOpts?: Parameters<typeof createCache>[0]) {
  const app = express();
  app.use(express.json());

  const cache = createCache(
    cacheOpts ?? {
      adapter: createMemoryAdapter(),
      staleTime: 5,
      gcTime: 10,
      swr: false,
      stampede: true,
    }
  );

  let callCount = 0;

  // GET /users — list users (tracks call count)
  app.get("/users", cache.route(), (req: Request, res: Response) => {
    callCount++;
    res.json({ users: ["alice", "bob"], callCount });
  });

  // GET /users/:id — single user
  app.get("/users/:id", cache.route(), (req: Request, res: Response) => {
    callCount++;
    res.json({ user: req.params.id, callCount });
  });

  // POST /users — create user (invalidates /users tree)
  app.post(
    "/users",
    cache.invalidate("/users"),
    (req: Request, res: Response) => {
      res.json({ created: true });
    }
  );

  // GET /slow — 200ms delay to test stampede
  app.get("/slow", cache.route(), async (req: Request, res: Response) => {
    callCount++;
    await new Promise((r) => setTimeout(r, 200));
    res.json({ slow: true, callCount });
  });

  // GET /error — returns 500 (should NOT be cached)
  app.get("/error", cache.route(), (req: Request, res: Response) => {
    callCount++;
    res.status(500).json({ error: "fail", callCount });
  });

  return { app, cache, getCallCount: () => callCount, resetCallCount: () => { callCount = 0; } };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("@express-route-cache/core", () => {
  // ── 1. Cache HIT / MISS ─────────────────────────────────────────────

  describe("Cache HIT / MISS", () => {
    it("first request should be a MISS", async () => {
      const { app } = createTestApp();
      const res = await request(app).get("/users");

      expect(res.status).toBe(200);
      expect(res.headers["x-cache"]).toBe("MISS");
      expect(res.body.callCount).toBe(1);
    });

    it("second request should be a HIT (handler not called again)", async () => {
      const { app, getCallCount } = createTestApp();

      // 1st request — MISS
      await request(app).get("/users");
      expect(getCallCount()).toBe(1);

      // 2nd request — HIT
      const res2 = await request(app).get("/users");
      expect(res2.status).toBe(200);
      expect(res2.headers["x-cache"]).toBe("HIT");
      expect(getCallCount()).toBe(1); // handler NOT called again
    });

    it("different routes should have independent caches", async () => {
      const { app, getCallCount } = createTestApp();

      await request(app).get("/users");
      await request(app).get("/users/alice");
      expect(getCallCount()).toBe(2); // both are MISS

      // Both should be HIT now
      const res1 = await request(app).get("/users");
      const res2 = await request(app).get("/users/alice");
      expect(res1.headers["x-cache"]).toBe("HIT");
      expect(res2.headers["x-cache"]).toBe("HIT");
      expect(getCallCount()).toBe(2); // no additional handler calls
    });

    it("different query params should have different cache keys", async () => {
      const { app, getCallCount } = createTestApp();

      await request(app).get("/users?page=1");
      await request(app).get("/users?page=2");
      expect(getCallCount()).toBe(2); // both are MISS (different query params)
    });
  });

  // ── 2. Cache Headers ────────────────────────────────────────────────

  describe("Cache Headers", () => {
    it("MISS should include X-Cache: MISS and Age: 0", async () => {
      const { app } = createTestApp();
      const res = await request(app).get("/users");

      expect(res.headers["x-cache"]).toBe("MISS");
      expect(res.headers["age"]).toBe("0");
      expect(res.headers["cache-control"]).toMatch(/max-age=\d+/);
    });

    it("HIT should include X-Cache: HIT and Age > 0", async () => {
      const { app } = createTestApp();

      await request(app).get("/users");

      // Small delay to ensure age > 0
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app).get("/users");
      expect(res.headers["x-cache"]).toBe("HIT");
      expect(res.headers["cache-control"]).toMatch(/max-age=\d+/);
    });
  });

  // ── 3. O(1) Epoch Invalidation ──────────────────────────────────────

  describe("O(1) Epoch Invalidation", () => {
    it("POST /users should invalidate GET /users cache", async () => {
      const { app, getCallCount } = createTestApp();

      // Populate cache
      await request(app).get("/users");
      expect(getCallCount()).toBe(1);

      // HIT
      const hit = await request(app).get("/users");
      expect(hit.headers["x-cache"]).toBe("HIT");
      expect(getCallCount()).toBe(1);

      // Invalidate
      await request(app).post("/users").send({});

      // Should be MISS again (epoch changed)
      const miss = await request(app).get("/users");
      expect(miss.headers["x-cache"]).toBe("MISS");
      expect(getCallCount()).toBe(2); // handler called again
    });

    it("invalidating /users should also bust /users/:id (route-tree invalidation)", async () => {
      const { app, getCallCount } = createTestApp();

      // Populate both caches
      await request(app).get("/users");
      await request(app).get("/users/alice");
      expect(getCallCount()).toBe(2);

      // Both HIT
      const h1 = await request(app).get("/users");
      const h2 = await request(app).get("/users/alice");
      expect(h1.headers["x-cache"]).toBe("HIT");
      expect(h2.headers["x-cache"]).toBe("HIT");
      expect(getCallCount()).toBe(2);

      // Invalidate /users (should bust /users AND /users/alice)
      await request(app).post("/users").send({});

      // Both should be MISS now
      const m1 = await request(app).get("/users");
      const m2 = await request(app).get("/users/alice");
      expect(m1.headers["x-cache"]).toBe("MISS");
      expect(m2.headers["x-cache"]).toBe("MISS");
      expect(getCallCount()).toBe(4); // both handlers called again
    });
  });

  // ── 4. Only GET requests are cached ─────────────────────────────────

  describe("Only GET cached", () => {
    it("POST requests should NOT be cached", async () => {
      const { app } = createTestApp();

      const res1 = await request(app).post("/users").send({});
      const res2 = await request(app).post("/users").send({});

      // No X-Cache header on non-GET
      expect(res1.headers["x-cache"]).toBeUndefined();
      expect(res2.headers["x-cache"]).toBeUndefined();
    });
  });

  // ── 5. Error responses NOT cached ───────────────────────────────────

  describe("Error responses NOT cached", () => {
    it("500 responses should NOT be cached", async () => {
      const { app, getCallCount } = createTestApp();

      await request(app).get("/error");
      expect(getCallCount()).toBe(1);

      await request(app).get("/error");
      expect(getCallCount()).toBe(2); // handler called every time (not cached)
    });
  });

  // ── 6. Stampede Protection ──────────────────────────────────────────

  describe("Stampede Protection", () => {
    it("10 concurrent requests to cold cache should trigger only 1 handler call", async () => {
      const { app, getCallCount } = createTestApp();

      // Fire 10 requests simultaneously to /slow (200ms handler)
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => request(app).get("/slow"))
      );

      // All should succeed
      for (const res of responses) {
        expect(res.status).toBe(200);
      }

      // Only 1 handler call due to stampede coalescing
      expect(getCallCount()).toBe(1);
    });
  });

  // ── 7. SWR (Stale-While-Revalidate) ────────────────────────────────

  describe("SWR (Stale-While-Revalidate)", () => {
    it("stale data should be served with X-Cache: STALE when swr is enabled", async () => {
      const { app } = createTestApp({
        adapter: createMemoryAdapter(),
        staleTime: 1, // 1 second
        gcTime: 10,
        swr: true,
      });

      // Populate cache
      await request(app).get("/users");

      // Wait for data to become stale (>1s)
      await new Promise((r) => setTimeout(r, 1200));

      // Should get STALE response
      const res = await request(app).get("/users");
      expect(res.status).toBe(200);
      expect(res.headers["x-cache"]).toBe("STALE");
    });

    it("with swr:false, stale data should result in a MISS", async () => {
      const { app, getCallCount } = createTestApp({
        adapter: createMemoryAdapter(),
        staleTime: 1,
        gcTime: 10,
        swr: false,
      });

      // Populate cache
      await request(app).get("/users");
      expect(getCallCount()).toBe(1);

      // Wait for data to become stale
      await new Promise((r) => setTimeout(r, 1200));

      // Should be MISS (not stale serve)
      const res = await request(app).get("/users");
      expect(res.headers["x-cache"]).toBe("MISS");
      expect(getCallCount()).toBe(2); // handler called again
    });
  });

  // ── 8. Programmatic Invalidation ────────────────────────────────────

  describe("Programmatic Invalidation", () => {
    it("cache.invalidateRoute() should bust cache from outside middleware", async () => {
      const { app, cache, getCallCount } = createTestApp();

      // Populate cache
      await request(app).get("/users");
      expect(getCallCount()).toBe(1);

      // Programmatic invalidation (e.g., from a cron job or webhook)
      await cache.invalidateRoute("/users");

      // Should be MISS
      const res = await request(app).get("/users");
      expect(res.headers["x-cache"]).toBe("MISS");
      expect(getCallCount()).toBe(2);
    });
  });

  // ── 9. Disabled caching ─────────────────────────────────────────────

  describe("Disabled caching", () => {
    it("enabled:false should pass through without caching", async () => {
      const { app, getCallCount } = createTestApp({
        adapter: createMemoryAdapter(),
        staleTime: 60,
        gcTime: 300,
        enabled: false,
      });

      await request(app).get("/users");
      await request(app).get("/users");
      expect(getCallCount()).toBe(2); // handler called both times
    });
  });
});
