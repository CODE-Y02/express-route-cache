import NodeCache from "node-cache";
import type { CacheClient } from "../types";

/**
 * Create an in-memory cache adapter using NodeCache.
 * Ships with `@express-route-cache/core` — zero external dependencies.
 *
 * Best for: local development, single-process apps, testing.
 * For distributed/multi-instance production: use Redis or Memcached adapters.
 *
 * @param defaultTTLSeconds - Default TTL for entries without explicit TTL. Defaults to 600 (10 min).
 *
 * @example
 * ```ts
 * import { createCache, createMemoryAdapter } from '@express-route-cache/core';
 *
 * const cache = createCache({
 *   adapter: createMemoryAdapter(),
 *   staleTime: 60,
 * });
 * ```
 */
export function createMemoryAdapter(defaultTTLSeconds = 600): CacheClient {
  const cache = new NodeCache({ stdTTL: defaultTTLSeconds, useClones: false });

  return {
    async get(key: string): Promise<string | null> {
      const value = cache.get<string>(key);
      return value ?? null;
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
      const result = cache.mget<string>(keys);
      return keys.map((k) => result[k] ?? null);
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      if (ttl !== undefined && ttl > 0) {
        cache.set(key, value, ttl);
      } else {
        cache.set(key, value);
      }
    },

    async del(...keys: string[]): Promise<void> {
      cache.del(keys);
    },

    async incr(key: string): Promise<number> {
      const current = cache.get<string>(key);
      const newVal = current !== undefined ? (parseInt(current, 10) || 0) + 1 : 1;
      // Epoch keys should not expire (they're counters)
      cache.set(key, String(newVal), 0);
      return newVal;
    },
  };
}
