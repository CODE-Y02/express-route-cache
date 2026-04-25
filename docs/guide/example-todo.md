---
title: "Example: Todo App | @express-route-cache"
description: A complete walkthrough of building a Todo API with automatic cache invalidation and SWR.
---

# Example: Todo App

This example demonstrates how to build a production-ready Todo API using `@express-route-cache`. We will focus on **Automatic Invalidation** and **SWR**.

## 1. Setup

First, initialize your cache with an adapter (we'll use Memory for this example).

```ts
import express from 'express';
import { createCache, createMemoryAdapter } from '@express-route-cache/core';

const app = express();
app.use(express.json());

const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 60, // 1 minute fresh
  swr: true      // Background refresh
});
```

## 2. Listing Todos (Cached)

We use `cache.route()` without any arguments to use the global defaults. This route will be cached at `/api/todos`.

```ts
app.get('/api/todos', cache.route(), (req, res) => {
  // Imagine a slow DB call here
  res.json([
    { id: 1, text: 'Buy milk', completed: false },
    { id: 2, text: 'Build cache library', completed: true }
  ]);
});
```

## 3. Adding a Todo (Auto-Invalidate)

When we add a new todo, we want the list cache (`/api/todos`) to be cleared immediately. By setting `autoInvalidate: true`, the library will automatically increment the version for this route pattern after a successful `POST`.

```ts
app.post('/api/todos', cache.route({ autoInvalidate: true }), (req, res) => {
  // 1. Save to DB...
  // 2. Cache for '/api/todos' is automatically invalidated!
  res.status(201).json({ id: 3, ...req.body });
});
```

## 4. Updating a Todo (Targeted Invalidation)

When updating a specific todo, we want to invalidate both the **item** and the **list**. 

```ts
app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;

  // Manual programmatic invalidation
  res.on('finish', async () => {
    if (res.statusCode === 200) {
      // Invalidate both the specific item and the parent list
      await cache.invalidateRoute(`/api/todos/${id}`, '/api/todos');
    }
  });

  res.json({ id, ...req.body });
});
```

## 💡 Key Takeaways

1.  **Zero Work on GET**: Just add `cache.route()` and your API is instantly faster.
2.  **Safe Mutations**: Using `autoInvalidate` or `res.on('finish')` ensures you never serve stale data after a database change.
3.  **High Performance**: All invalidations shown here are **O(1)** operations.
