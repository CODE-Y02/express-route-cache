import express from "express";
import { createNodeCacheClient } from "../src/adapters/nodeCacheClient";
import { createCacheMiddleware, createInvalidateMiddleware } from "../src";

const app = express();
app.use(express.json());

const cacheClient = createNodeCacheClient(120);

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
