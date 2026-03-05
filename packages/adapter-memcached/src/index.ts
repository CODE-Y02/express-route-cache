/// <reference path="./memjs.d.ts" />
import memjs from "memjs";
import type { CacheClient } from "@express-route-cache/core";

/** Options for connecting to Memcached. */
export interface MemcachedAdapterOptions {
  /**
   * Memcached server(s) as comma-separated string.
   * @default "localhost:11211"
   * @example "server1:11211,server2:11211"
   */
  servers?: string;

  /** Additional memjs client options. */
  options?: Record<string, unknown>;

  /** Existing memjs Client instance (if you want to reuse a connection). */
  client?: InstanceType<typeof memjs.Client>;
}

/**
 * Create a Memcached cache adapter using memjs.
 * Best for: production apps that need simple, high-throughput KV caching.
 *
 * Memcached is multi-threaded (unlike Redis) and excels at pure cache workloads.
 * Our adapter uses only basic KV + incr — no Set operations needed.
 *
 * @example
 * ```ts
 * import { createCache } from '@express-route-cache/core';
 * import { createMemcachedAdapter } from '@express-route-cache/memcached';
 *
 * const cache = createCache({
 *   adapter: createMemcachedAdapter({ servers: 'localhost:11211' }),
 *   staleTime: 60,
 * });
 * ```
 */
export function createMemcachedAdapter(
  opts: MemcachedAdapterOptions = {}
): CacheClient {
  const client =
    opts.client ??
    memjs.Client.create(opts.servers ?? "localhost:11211", opts.options as any ?? {});

  return {
    async get(key: string): Promise<string | null> {
      const { value } = await client.get(key);
      return value ? value.toString("utf-8") : null;
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
      // memjs doesn't have native multi-get, so we parallelize
      return Promise.all(
        keys.map(async (key) => {
          const { value } = await client.get(key);
          return value ? value.toString("utf-8") : null;
        })
      );
    },

    async set(
      key: string,
      value: string,
      ttlSeconds?: number
    ): Promise<void> {
      await client.set(key, value, {
        expires: ttlSeconds ?? 0,
      });
    },

    async del(...keys: string[]): Promise<void> {
      await Promise.all(keys.map((key) => client.delete(key)));
    },

    async incr(key: string): Promise<number> {
      try {
        const result = await client.increment(key, 1, {
          initial: 1,
          expires: 0,
        });
        return typeof result?.value === "number" ? result.value : 1;
      } catch {
        // If the key doesn't exist, some memcached versions throw.
        // Fallback: set it to "1"
        await client.set(key, "1", { expires: 0 });
        return 1;
      }
    },

    async disconnect(): Promise<void> {
      if (!opts.client) {
        client.close();
      }
    },
  };
}
