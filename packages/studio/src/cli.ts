#!/usr/bin/env node

import path from "path";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import open from "open";
import {
  createCache,
  createMemoryAdapter,
  type CacheConfig,
} from "@express-route-cache/core";
import { createRedisAdapter } from "@express-route-cache/redis";
import { createMemcachedAdapter } from "@express-route-cache/memcached";
import { createStudio } from "./index";

async function run() {
  dotenv.config();

  console.log("🚀 Starting Cache Studio CLI...");

  let config: CacheConfig | null = null;
  const jsPath = path.resolve(process.cwd(), "erc.config.js");
  const jsonPath = path.resolve(process.cwd(), "erc.config.json");

  if (fs.existsSync(jsPath)) {
    try {
      // Dynamic import supports ESM and CommonJS configuration file detection
      const configModule = await import(jsPath);
      config = configModule.default || configModule;
      console.log(`Loaded configuration from: ${jsPath}`);
    } catch (err) {
      console.warn("Failed to load erc.config.js:", err);
    }
  } else if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, "utf-8");
      config = JSON.parse(content);
      console.log(`Loaded configuration from: ${jsonPath}`);
    } catch (err) {
      console.warn("Failed to load erc.config.json:", err);
    }
  }

  // If no config file found, fall back to environment variables
  if (!config) {
    let adapter;
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      console.log("Auto-detecting Redis from environment variables...");
      adapter = createRedisAdapter({
        url: process.env.REDIS_URL,
        options: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
            ? parseInt(process.env.REDIS_PORT)
            : undefined,
          password: process.env.REDIS_PASSWORD,
        },
      });
    } else if (process.env.MEMCACHED_SERVERS) {
      console.log("Auto-detecting Memcached from environment variables...");
      adapter = createMemcachedAdapter({
        servers: process.env.MEMCACHED_SERVERS,
      });
    } else {
      console.warn("⚠️  No redis or memcached environment variables found.");
      console.log(
        "Defaulting to Memory adapter. Note: This will be isolated to the CLI process!",
      );
      adapter = createMemoryAdapter();
    }
    config = {
      adapter,
      metrics: true, // Enable metrics by default in CLI
    };
  }

  // Ensure adapter is present
  if (!config || !config.adapter) {
    console.error("Error: Configuration is missing the 'adapter' property.");
    process.exit(1);
  }

  const finalConfig: CacheConfig = {
    ...config,
    metrics: config.metrics ?? true,
  };

  // Create Cache Instance
  const cache = createCache(finalConfig);

  const app = express();
  const port = process.env.PORT || 5555;

  app.use(createStudio({ cache }));

  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n✨ Cache Studio is running at: ${url}`);
    console.log("Press Ctrl+C to stop.");
    open(url).catch(() => {});
  });
}

run().catch((err) => {
  console.error("Failed to start Cache Studio CLI:", err);
  process.exit(1);
});
