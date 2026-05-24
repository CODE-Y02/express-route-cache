---
title: "Express.js Caching Example: Todo REST API | @express-route-cache"
description: "Complete walkthrough of building a cached Todo REST API with Express.js — featuring automatic cache invalidation with SWR, targeted invalidation, and O(1) performance."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/example-todo
  - - meta
    - property: og:title
      content: "Express.js Caching Example: Todo REST API | @express-route-cache"
  - - meta
    - property: og:description
      content: "Build a fully cached Express.js REST API from scratch. Covers SWR, auto-invalidation, targeted invalidation, and O(1) operations."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/example-todo
---

# Example: Todo API

A complete, realistic walkthrough of integrating `@express-route-cache` into an Express REST API. This example uses a simple in-process data store to simulate a database so you can focus on the caching patterns.

## Setup

```ts
import express from "express";
import { createCache, createMemoryAdapter } from "@express-route-cache/core";

const app = express();
app.use(express.json());

// In-process "database" — replace with your real DB calls
const db = {
  todos: [
    { id: 1, text: "Buy groceries", completed: false },
    { id: 2, text: "Ship the feature", completed: true },
  ],
  nextId: 3,
};

const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 30, // Fresh for 30 seconds
  gcTime: 300, // Keep stale for 5 more minutes
  swr: true, // Serve stale instantly while refreshing in background
  metrics: true, // Enable for the health endpoint below
});
```

---

## GET /api/todos — Cached List

The first request executes the handler (MISS). Every subsequent request within `staleTime` returns instantly from cache (HIT).

```ts
app.get("/api/todos", cache.route(), (_req, res) => {
  // Simulates a slow DB query
  res.json(db.todos);
});
```

Verify it's working:

```bash
curl -I http://localhost:3000/api/todos
# X-Cache: MISS   ← first request

curl -I http://localhost:3000/api/todos
# X-Cache: HIT    ← served from cache
```

---

## GET /api/todos/:id — Per-Item Cache

Each item gets its own cache entry, keyed by its ID.

```ts
app.get("/api/todos/:id", cache.route({ staleTime: 60 }), (req, res) => {
  const todo = db.todos.find((t) => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: "Not found" });
  res.json(todo);
});
```

---

## POST /api/todos — Create with Auto-Invalidation

When a new todo is created, the cached list at `/api/todos` must be cleared. `autoInvalidate: true` handles this automatically after any successful 2xx response.

```ts
app.post("/api/todos", cache.route({ autoInvalidate: true }), (req, res) => {
  const newTodo = { id: db.nextId++, text: req.body.text, completed: false };
  db.todos.push(newTodo);

  // The cache for '/api/todos' is automatically invalidated after this response
  res.status(201).json(newTodo);
});
```

---

## PATCH /api/todos/:id — Update with Targeted Invalidation

When updating a specific item, we need to invalidate both the **item's own cache entry** and the **parent list** (since it shows the item's data). Use `cache.invalidate()` middleware to specify exactly which patterns to clear.

```ts
app.patch(
  "/api/todos/:id",
  cache.invalidate("/api/todos/:id", "/api/todos"), // invalidates both on 2xx
  (req, res) => {
    const todo = db.todos.find((t) => t.id === Number(req.params.id));
    if (!todo) return res.status(404).json({ error: "Not found" });

    todo.text = req.body.text ?? todo.text;
    todo.completed = req.body.completed ?? todo.completed;

    res.json(todo);
  },
);
```

---

## DELETE /api/todos/:id — Delete with Targeted Invalidation

```ts
app.delete(
  "/api/todos/:id",
  cache.invalidate("/api/todos/:id", "/api/todos"),
  (req, res) => {
    const idx = db.todos.findIndex((t) => t.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    db.todos.splice(idx, 1);
    res.status(204).send();
  },
);
```

---

## GET /health — Cache Metrics

```ts
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    cache: cache.metrics,
  });
});
```

---

## Full Request Flow

```bash
# 1. Create a todo (POST → creates todo + invalidates /api/todos cache)
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"Read the docs"}'
# → 201 { id: 3, text: "Read the docs", completed: false }

# 2. List todos (cache was just invalidated — MISS)
curl -I http://localhost:3000/api/todos
# X-Cache: MISS

# 3. List todos again (HIT)
curl -I http://localhost:3000/api/todos
# X-Cache: HIT

# 4. Wait 30 seconds for staleTime to pass, then list again
# X-Cache: STALE  ← served instantly, background refresh fires

# 5. Update a todo (invalidates /api/todos/:id AND /api/todos)
curl -X PATCH http://localhost:3000/api/todos/3 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 6. Check metrics
curl http://localhost:3000/health
# → { status: "ok", cache: { hits: 2, misses: 2, swrHits: 1, ... } }
```

---

## Key Takeaways

| Pattern                       | Method                                        |
| :---------------------------- | :-------------------------------------------- |
| Cache a GET route             | `cache.route()`                               |
| Auto-invalidate on mutation   | `cache.route({ autoInvalidate: true })`       |
| Invalidate specific patterns  | `cache.invalidate('/pattern1', '/pattern2')`  |
| Zero-latency after first miss | `swr: true`                                   |
| Debug cache behaviour         | `X-Cache` header + `/health` metrics endpoint |
