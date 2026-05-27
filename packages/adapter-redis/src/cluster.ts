import Redis, { type ClusterNode, type ClusterOptions } from "ioredis";
import type { CacheClient } from "@express-route-cache/core";

/** Options for connecting to a Redis Cluster. */
export interface RedisClusterAdapterOptions {
  /**
   * List of seed nodes for the cluster.
   * @example [{ host: "10.0.0.1", port: 6380 }, { host: "10.0.0.2", port: 6380 }]
   */
  nodes: ClusterNode[];

  /** ioredis ClusterOptions (scaleReads, natMap, etc). */
  options?: ClusterOptions;

  /** Existing ioredis Cluster instance (if you want to reuse a connection). */
  client?: InstanceType<typeof Redis.Cluster>;
}

/**
 * Create a Redis Cluster cache adapter using ioredis.
 * Best for: production deployments using AWS ElastiCache Cluster,
 * Redis Cluster, or any sharded Redis topology.
 *
 * Handles cross-slot operations correctly:
 * - `mget` → ioredis Cluster handles cross-slot transparently
 * - `del`  → pipelined per-key DELs for cross-slot safety
 * - `keys` → SCANs all master nodes individually
 *
 * @example
 * ```ts
 * import { createCache } from '@express-route-cache/core';
 * import { createRedisClusterAdapter } from '@express-route-cache/redis';
 *
 * const cache = createCache({
 *   adapter: createRedisClusterAdapter({
 *     nodes: [
 *       { host: '10.0.0.1', port: 6380 },
 *       { host: '10.0.0.2', port: 6380 },
 *     ],
 *   }),
 *   staleTime: 60,
 *   swr: true,
 * });
 * ```
 */
export function createRedisClusterAdapter(
  opts: RedisClusterAdapterOptions,
): CacheClient {
  const cluster =
    opts.client ??
    new Redis.Cluster(opts.nodes, {
      enableOfflineQueue: false,
      ...opts.options,
    });

  return {
    name: "redis-cluster" as const,

    async ping(): Promise<boolean> {
      try {
        await cluster.ping();
        return true;
      } catch {
        return false;
      }
    },

    async get(key: string): Promise<string | null> {
      return cluster.get(key);
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
      if (keys.length === 0) return [];
      // ioredis Cluster transparently handles cross-slot MGET
      return cluster.mget(...keys);
    },

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await cluster.set(key, value, "EX", ttlSeconds);
      } else {
        await cluster.set(key, value);
      }
    },

    async del(...keys: string[]): Promise<void> {
      if (keys.length === 0) return;
      // Pipeline individual DELs to handle keys in different hash slots
      const pipeline = cluster.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
    },

    async incr(key: string): Promise<number> {
      return cluster.incr(key);
    },

    async setNX(
      key: string,
      value: string,
      ttlSeconds: number,
    ): Promise<boolean> {
      const result = await cluster.set(key, value, "EX", ttlSeconds, "NX");
      return result === "OK";
    },

    async keys(pattern = "*"): Promise<string[]> {
      // In cluster mode, SCAN must execute on every master node individually
      const masters = cluster.nodes("master");
      const allKeys: string[] = [];

      for (const node of masters) {
        let cursor = "0";
        do {
          const [nextCursor, scannedKeys] = await node.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100,
          );
          cursor = nextCursor;
          allKeys.push(...scannedKeys);
          if (allKeys.length >= 1000) break;
        } while (cursor !== "0");
        if (allKeys.length >= 1000) break;
      }

      return allKeys;
    },

    async disconnect(): Promise<void> {
      if (!opts.client) {
        await cluster.quit();
      }
    },
  };
}
