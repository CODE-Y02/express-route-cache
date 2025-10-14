import {
  createCacheMiddleware,
  createInvalidateMiddleware,
  createNodeCacheClient,
} from "@express-route-cache/core";
import express, { Request, Response } from "express";
import portfinder from "portfinder";

const app = express();
app.use(express.json());

const cacheClient = createNodeCacheClient(120);

const cacheMiddleware = createCacheMiddleware({ cacheClient, ttlSeconds: 120 });
const invalidateMiddleware = createInvalidateMiddleware({ cacheClient });

/***
 * NOTE: Don't use it like app.use(cacheMiddleware)
 */

app.get(
  "/v1/users/:username",
  cacheMiddleware,
  async (req: Request, res: Response) => {
    await simulateDelay(2000);
    res.json({ username: req.params.username, data: "Some user data" });
  }
);

app.post("/v1/users", invalidateMiddleware, (req: Request, res: Response) => {
  res.json({ message: "User created" });
});

app.post(
  "/v1/users/:username",
  invalidateMiddleware,
  (req: Request, res: Response) => {
    res.json({ message: "User updated  " + req.params.username });
  }
);

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

const simulateDelay = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));
