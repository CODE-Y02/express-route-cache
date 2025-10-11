# express-route-cache

> Type-safe, pluggable route-pattern caching middleware for Express.js.

## Installation

```bash
npm install express-route-cache express node-cache
```

## Usage

```javascript
const express = require("express");
const {
  createNodeCacheClient,
  createCacheMiddleware,
  createInvalidateMiddleware,
} = require("express-route-cache");

const app = express();
app.use(express.json());

const cacheClient = createNodeCacheClient(120); // 120 seconds TTL
const cacheMiddleware = createCacheMiddleware({ cacheClient, ttlSeconds: 120 });
const invalidateMiddleware = createInvalidateMiddleware({ cacheClient });

app.get("/v1/users/:username", cacheMiddleware, (req, res) => {
  res.json({ username: req.params.username, data: "Some user data" });
});

app.post("/v1/users", invalidateMiddleware, (req, res) => {
  res.json({ message: "User created" });
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
```

## Redis Support

> To use Redis:

```bash
npm install ioredis
```

```js
const { createRedisCacheClient } = require("express-route-cache");
const Redis = require("ioredis");
const cacheClient = createRedisCacheClient(
  new Redis({ host: "localhost", port: 6379 })
);
```

## Requirements

Node.js >= 14.0.0
Express ^4.17.1 or ^5.0.0
Optional: ioredis ^5.3.2 for Redis support
