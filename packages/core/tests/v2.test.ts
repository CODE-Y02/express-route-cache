import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import { createCache, createMemoryAdapter } from "../src/index";

describe("Route Cache V2 Features & Bug Fixes", () => {
  let app: express.Express;
  let cache: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    cache = createCache({
      adapter: createMemoryAdapter(),
      staleTime: 60,
      autoInvalidate: false,
    });
  });

  describe("Binary Data Support", () => {
    it("should not corrupt binary data (Buffer)", async () => {
      const binaryData = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
      ]);

      app.get("/binary", cache.route(), (req, res) => {
        res.setHeader("Content-Type", "image/jpeg");
        res.send(binaryData);
      });

      // 1st request - MISS
      const res1 = await request(app).get("/binary");
      expect(res1.status).toBe(200);
      expect(res1.headers["x-cache"]).toBe("MISS");
      expect(Buffer.compare(res1.body, binaryData)).toBe(0);

      // 2nd request - HIT
      const res2 = await request(app).get("/binary");
      expect(res2.status).toBe(200);
      expect(res2.headers["x-cache"]).toBe("HIT");
      expect(Buffer.compare(res2.body, binaryData)).toBe(0); // Should match exactly
    });
  });

  describe("Header Preservation", () => {
    it("should preserve custom headers", async () => {
      app.get("/headers", cache.route(), (req, res) => {
        res.setHeader("X-Custom-Header", "hello-world");
        res.json({ ok: true });
      });

      await request(app).get("/headers"); // Warm up
      const res = await request(app).get("/headers");

      expect(res.headers["x-cache"]).toBe("HIT");
      expect(res.headers["x-custom-header"]).toBe("hello-world");
    });

    it("should NOT leak set-cookie or internal headers", async () => {
      app.get("/leak", cache.route(), (req, res) => {
        res.setHeader("Set-Cookie", "session=123");
        res.setHeader("X-Express-Internal", "secret");
        res.json({ ok: true });
      });

      await request(app).get("/leak");
      const res = await request(app).get("/leak");

      expect(res.headers["x-cache"]).toBe("HIT");
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect(res.headers["x-express-internal"]).toBeUndefined();
    });
  });

  describe("Cache-Control Security", () => {
    it("should respect existing Cache-Control: private", async () => {
      app.get("/private", cache.route(), (req, res) => {
        res.setHeader("Cache-Control", "private, no-cache");
        res.json({ secret: "data" });
      });

      await request(app).get("/private");
      const res = await request(app).get("/private");

      expect(res.headers["x-cache"]).toBe("HIT");
      expect(res.headers["cache-control"]).toBe("private, no-cache");
    });

    it("should apply default public Cache-Control if missing", async () => {
      app.get("/public", cache.route(), (req, res) => {
        res.json({ public: "data" });
      });

      await request(app).get("/public");
      const res = await request(app).get("/public");

      expect(res.headers["x-cache"]).toBe("HIT");
      expect(res.headers["cache-control"]).toContain("public, max-age=");
    });
  });

  describe("Auto-Invalidation", () => {
    it("should automatically invalidate cache on POST when enabled", async () => {
      const cacheWithAuto = createCache({
        adapter: createMemoryAdapter(),
        autoInvalidate: true,
      });

      let count = 0;
      app.get("/data", cacheWithAuto.route(), (req, res) => {
        res.json({ count: ++count });
      });

      app.post("/data", cacheWithAuto.route(), (req, res) => {
        res.json({ success: true });
      });

      // 1. Warm up GET cache
      const g1 = await request(app).get("/data");
      expect(g1.body.count).toBe(1);

      const g2 = await request(app).get("/data");
      expect(g2.headers["x-cache"]).toBe("HIT");
      expect(g2.body.count).toBe(1);

      // 2. Perform POST (should trigger auto-invalidation)
      const p1 = await request(app).post("/data").send({});
      expect(p1.status).toBe(200);

      // Tiny delay for the 'finish' event to process the async epoch increment
      await new Promise((r) => setTimeout(r, 50));

      // 3. Next GET should be a MISS
      const g3 = await request(app).get("/data");
      expect(g3.headers["x-cache"]).toBe("MISS");
      expect(g3.body.count).toBe(2);
    });
  });

  describe("New V2 Fixes (SWR Lock, Hashing, Fetch Buffer, CORS SWR)", () => {
    it("should hash the cache key to prevent length overflow", async () => {
      app.get(
        "/very-long-url-path-with-query-parameters",
        cache.route({ vary: ["X-Vary-Header"] }),
        (req, res) => {
          res.json({ ok: true });
        },
      );

      const res = await request(app)
        .get("/very-long-url-path-with-query-parameters")
        .set("X-Vary-Header", "token-value");
      expect(res.headers["x-cache"]).toBe("MISS");
    });

    it("should support Buffer in standalone cache.fetch", async () => {
      const bufferData = Buffer.from("hello-world-binary");
      const result = await cache.fetch(
        "binary-fetch-key",
        async () => {
          return bufferData;
        },
        { staleTime: 60 },
      );

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("hello-world-binary");

      // Verify it retrieves from cache as a Buffer
      const resultCached = await cache.fetch(
        "binary-fetch-key",
        async () => {
          return Buffer.from("should-not-hit");
        },
        { staleTime: 60 },
      );
      expect(Buffer.isBuffer(resultCached)).toBe(true);
      expect(resultCached.toString()).toBe("hello-world-binary");
    });

    it("should copy CORS headers on SWR background revalidation", async () => {
      const swrCache = createCache({
        adapter: createMemoryAdapter(),
        staleTime: 1, // 1 second
        gcTime: 60,
        swr: true,
      });

      let hitCount = 0;
      app.get("/swr-cors", swrCache.route(), (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.json({ hitCount: ++hitCount });
      });

      // 1st request: MISS (sets header)
      const res1 = await request(app).get("/swr-cors");
      expect(res1.headers["access-control-allow-origin"]).toBe("*");
      expect(res1.body.hitCount).toBe(1);

      // Wait 1.1 seconds for stale
      await new Promise((r) => setTimeout(r, 1100));

      // 2nd request: STALE HIT (serves stale, triggers background revalidation)
      const res2 = await request(app).get("/swr-cors");
      expect(res2.headers["x-cache"]).toBe("STALE");
      expect(res2.headers["access-control-allow-origin"]).toBe("*");
      expect(res2.body.hitCount).toBe(1);

      // Wait 100ms for SWR to write back
      await new Promise((r) => setTimeout(r, 100));

      // 3rd request: HIT (should serve fresh data from SWR revalidation and STILL have CORS header!)
      const res3 = await request(app).get("/swr-cors");
      expect(res3.headers["x-cache"]).toBe("HIT");
      expect(res3.headers["access-control-allow-origin"]).toBe("*");
      expect(res3.body.hitCount).toBe(2);
    });
  });
});
