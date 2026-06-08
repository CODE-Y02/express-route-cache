import { IncomingMessage, ServerResponse } from "http";
import express, { Router } from "express";
import path from "path";
import { CacheInstance } from "@express-route-cache/core";

export interface StudioConfig {
  cache: CacheInstance;
}

export function createStudio(
  config: StudioConfig,
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void {
  const router = Router();
  const cache = config.cache;

  // Redirect to trailing slash for correct relative asset loading
  router.use((req, res, next) => {
    if (req.baseUrl && req.originalUrl === req.baseUrl) {
      return res.redirect(301, req.originalUrl + "/");
    }
    next();
  });

  // Log Studio URL on first access
  let studioUrlLogged = false;
  router.use((req, res, next) => {
    if (!studioUrlLogged && (req.path === "/" || req.path === "")) {
      studioUrlLogged = true;
      const host = req.headers.host || "localhost";
      const mountPath = req.baseUrl || "/studio";
      console.log(`Cache Studio visible at --> http://${host}${mountPath}`);
    }
    next();
  });

  // 1. Status & Metrics Endpoint
  router.get("/api/status", async (_req, res) => {
    try {
      // Adapter type — use the `name` field added to CacheClient interface
      const adapter = cache.adapter.name ?? "memory";

      // Real health check — probe the adapter connection
      let connected = false;
      try {
        if (cache.adapter.ping) {
          connected = await cache.adapter.ping();
        } else {
          // Fallback: try a harmless GET — if it doesn't throw, we're connected
          await cache.adapter.get("__studio_health__");
          connected = true;
        }
      } catch {
        connected = false;
      }

      res.json({
        connected,
        adapter,
        metricsEnabled: !!cache.metrics,
        metrics: cache.metrics,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ connected: false, error: message });
    }
  });

  // 2. List all keys
  router.get("/api/keys", async (_req, res) => {
    try {
      if (!cache.adapter.keys) {
        return res.json({ keys: [] });
      }
      // Use the keys scan pattern
      const keys = await cache.adapter.keys();
      res.json({ keys });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // 3. Key Detail
  router.get("/api/keys/detail", async (req, res) => {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ error: "Missing key query parameter" });
    }
    try {
      const val = await cache.adapter.get(key);
      if (!val) {
        return res.json({ key, exists: false, size: 0 });
      }
      let parsed = null;
      try {
        parsed = JSON.parse(val);
      } catch {}

      res.json({
        key,
        exists: true,
        size: val.length,
        parsed,
        raw: parsed ? undefined : val,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // 4. Purge key
  router.post("/api/purge", express.json(), async (req, res) => {
    const key = req.body.key;
    if (!key) {
      return res.status(400).json({ error: "Missing key in body" });
    }
    try {
      await cache.adapter.del(key);
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // 5. Purge all keys
  router.post("/api/purge-all", async (_req, res) => {
    try {
      if (cache.adapter.keys) {
        const keys = await cache.adapter.keys();
        if (keys.length > 0) {
          await cache.adapter.del(...keys);
        }
      }
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  });

  // Serve static UI assets
  // Resolve path safely supporting dev workspace and dist folders
  const publicPath = path.resolve(__dirname, "public");
  router.use(express.static(publicPath));

  // Fallback to SPA index.html
  router.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      res.sendFile(path.join(publicPath, "index.html"));
    } else {
      next();
    }
  });

  return router as unknown as (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => void;
}
