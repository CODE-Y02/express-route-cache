import Redis, { type RedisOptions } from "ioredis";
import type { CacheClient } from "@express-route-cache/core";

/** Options for connecting to Redis. */
export interface RedisAdapterOptions {
  /** Redis connection URL (e.g. `redis://localhost:6379`). */
  url?: string;
  /** ioredis options object (alternative to URL). */
  options?: RedisOptions;
  /** Existing ioredis instance (if you want to reuse a connection). */
  client?: Redis;
}

/**
 * Create a Redis cache adapter using ioredis.
 * Best for: production, distributed, multi-instance deployments.
 *
 * All operations map to native Redis commands for maximum performance:
 * - `get` → `GET`
 * - `mget` → `MGET`
 * - `set` → `SET EX`
 * - `del` → `DEL`
 * - `incr` → `INCR`
 *
 * @example
 * ```ts
 * import { createCache } from '@express-route-cache/core';
 * import { createRedisAdapter } from '@express-route-cache/redis';
 *
 * const cache = createCache({
 *   adapter: createRedisAdapter({ url: 'redis://localhost:6379' }),
 *   staleTime: 60,
 *   swr: true,
 * });
 * ```
 */
export function createRedisAdapter(
  opts: RedisAdapterOptions = {},
): CacheClient {
  const redis =
    opts.client ??
    (opts.url
      ? new Redis(opts.url, { enableOfflineQueue: false })
      : new Redis({ enableOfflineQueue: false, ...opts.options }));

  return {
    async get(key: string): Promise<string | null> {
      return redis.get(key);
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
      if (keys.length === 0) return [];
      return redis.mget(...keys);
    },

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await redis.set(key, value, "EX", ttlSeconds);
      } else {
        await redis.set(key, value);
      }
    },

    async del(...keys: string[]): Promise<void> {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },

    async incr(key: string): Promise<number> {
      return redis.incr(key);
    },

    async setNX(
      key: string,
      value: string,
      ttlSeconds: number,
    ): Promise<boolean> {
      const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
      return result === "OK";
    },

    async keys(pattern = "*"): Promise<string[]> {
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [nextCursor, scannedKeys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        keys.push(...scannedKeys);
        if (keys.length >= 1000) break;
      } while (cursor !== "0");
      return keys;
    },

    async disconnect(): Promise<void> {
      if (!opts.client) {
        await redis.quit();
      }
    },
  };
}
