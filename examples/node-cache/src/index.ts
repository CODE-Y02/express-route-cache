import { createCache, createMemoryAdapter } from "@express-route-cache/core";
import { createStudio } from "@express-route-cache/studio";
import express, { Request, Response } from "express";
import portfinder from "portfinder";

const app = express();
app.use(express.json());

// ── Create cache with TanStack-inspired options ──
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 120, // data fresh for 2 minutes
  gcTime: 300, // stale data lives 5 more minutes
  swr: true, // serve stale, revalidate in background
  stampede: true, // coalesce concurrent cold-cache requests
  metrics: true, // enable telemetry & stats
  studio: true, // enable Studio configuration reference
});

// ── Mount Cache Studio ──
app.use("/studio", createStudio({ cache }));

// ── Per-route caching ──

app.get(
  "/v1/users/:username",
  cache.route(),
  async (req: Request, res: Response) => {
    await simulateDelay(2000);
    res.json({ username: req.params.username, data: "Some user data" });
  },
);

// ── Context-based caching with ctx (user-scoped) ──
// Simulate auth middleware
app.use((req, res, next) => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  (res as any).locals.user = { id: userId, role: "user" };
  next();
});

app.get(
  "/v1/profile",
  cache.route({
    ctx: (req, res) => {
      const user = (res as any).locals.user;
      return user.id; // Each user gets their own cache entry
    },
  }),
  async (req: Request, res: Response) => {
    await simulateDelay(1500);
    const user = (res as any).locals.user;
    res.json({ userId: user.id, profile: `Profile data for ${user.id}` });
  },
);

// ── Automatic route-tree invalidation ──
// POST /v1/users invalidates ALL cached /v1/users/* routes (including /v1/users/:username)

app.post(
  "/v1/users",
  cache.invalidate("/v1/users"),
  (req: Request, res: Response) => {
    res.json({
      message: "User created (cache invalidated for /v1/users tree)",
    });
  },
);

app.post(
  "/v1/users/:username",
  cache.invalidate("/v1/users"),
  (req: Request, res: Response) => {
    res.json({ message: "User updated: " + req.params.username });
  },
);

// ── Non-cached route ──
app.get("/hi", (req, res) => {
  return res.json({ message: "hello from server" });
});

// ── Start server ──
portfinder.basePort = 3000;

portfinder.getPort((err, port) => {
  if (err) {
    console.error("Error finding an available port:", err);
  } else {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
      console.log(
        `Cache Studio visible at --> http://localhost:${port}/studio`,
      );
      console.log("");
      console.log("Try these:");
      console.log(
        `  GET  http://localhost:${port}/v1/users/john  (1st: MISS + 2s delay, 2nd: HIT instant)`,
      );
      console.log(
        `  POST http://localhost:${port}/v1/users       (invalidates all /v1/users/* cache)`,
      );
      console.log(
        `  GET  http://localhost:${port}/v1/users/john  (MISS again — cache was invalidated)`,
      );
      console.log("");
      console.log("Context-based caching (ctx):");
      console.log(
        `  GET  http://localhost:${port}/v1/profile     (with header: x-user-id: alice)`,
      );
      console.log(
        `  GET  http://localhost:${port}/v1/profile     (with header: x-user-id: bob)`,
      );
      console.log(
        `  GET  http://localhost:${port}/v1/profile     (same user = HIT, different user = MISS)`,
      );
    });
  }
});

const simulateDelay = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));
