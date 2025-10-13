import {
  createCacheMiddleware,
  createInvalidateMiddleware,
} from "@express-route-cache/core";
import express, { Request, Response } from "express";
import portfinder from "portfinder";
import createNodeCacheClient from "../../../packages/core/dist/adapters/nodeCache";

const app = express();
app.use(express.json());

const cacheClient = createNodeCacheClient(120);

const cacheMiddleware = createCacheMiddleware({ cacheClient, ttlSeconds: 120 });
const invalidateMiddleware = createInvalidateMiddleware({ cacheClient });

app.get(
  "/v1/users/:username",
  cacheMiddleware,
  (req: Request, res: Response) => {
    res.json({ username: req.params.username, data: "Some user data" });
  }
);

// TODO : FIX invalidation
app.post("/v1/users", invalidateMiddleware, (req: Request, res: Response) => {
  res.json({ message: "User created" });
});

app.get("/hi", (req, res) => {
  return res.json({ message: "hello from server" });
});

// Set the base port to 3000 or your desired port
portfinder.basePort = 3000;

portfinder.getPort((err, port) => {
  if (err) {
    console.error("Error finding an available port:", err);
  } else {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  }
});
