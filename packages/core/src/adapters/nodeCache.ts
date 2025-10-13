import NodeCache from "node-cache";
import type { CacheClient } from "../types";

export default function createNodeCacheClient(
  defaultTTLSeconds = 60
): CacheClient {
  const cache = new NodeCache({ stdTTL: defaultTTLSeconds, useClones: false });

  return {
    async get(key) {
      const value = cache.get<string>(key);
      return value ?? null;
    },

    async set(key, value, ttl) {
      // Provide default TTL fallback because NodeCache expects string|number, not undefined
      cache.set(key, value, ttl ?? 0);
    },

    async del(...keys) {
      cache.del(keys);
    },

    async sadd(setKey, member) {
      // 'sadd' is Redis command, here we simulate with an array in NodeCache
      let members = cache.get<string[]>(setKey) ?? [];
      if (!members.includes(member)) {
        members.push(member);
        cache.set(setKey, members);
      }
    },

    async smembers(setKey) {
      return cache.get<string[]>(setKey) ?? [];
    },

    async srem(setKey, member) {
      let members = cache.get<string[]>(setKey) ?? [];
      members = members.filter((m) => m !== member);
      cache.set(setKey, members);
    },
  };
}
