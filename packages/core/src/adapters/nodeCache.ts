import NodeCache from "node-cache";
import type { CacheClient } from "../types";

/**
 * Creates a CacheClient instance using NodeCache as the backend.
 * Provides a Redis-like interface for caching string values and
 * simulates Redis set operations using arrays stored in the cache.
 *
 * @param {number} [defaultTTLSeconds=60] - Default time-to-live in seconds for cache entries.
 * @returns {CacheClient} An object implementing the CacheClient interface.
 */
export function createNodeCacheClient(defaultTTLSeconds = 60): CacheClient {
  const cache = new NodeCache({ stdTTL: defaultTTLSeconds, useClones: false });

  return {
    /**
     * Retrieves a cached string value by key.
     *
     * @param {string} key - Cache key.
     * @returns {Promise<string | null>} The cached string value, or null if not found.
     */
    async get(key: string): Promise<string | null> {
      const value = cache.get<string>(key);
      return value ?? null;
    },

    /**
     * Sets a string value in the cache with an optional TTL.
     *
     * @param {string} key - Cache key.
     * @param {string} value - String value to cache.
     * @param {number} [ttl] - Optional TTL (time-to-live) in seconds.
     *                         If omitted, default TTL is used.
     * @returns {Promise<void>}
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
      // Provide default TTL fallback because NodeCache expects string|number, not undefined
      cache.set(key, value, ttl ?? 0);
    },

    /**
     * Deletes one or more keys from the cache.
     *
     * @param {...string} keys - One or more keys to delete.
     * @returns {Promise<void>}
     */
    async del(...keys: string[]): Promise<void> {
      cache.del(keys);
    },

    /**
     * Adds a member to a "set" stored as an array under the specified key.
     * Simulates Redis `SADD` command.
     *
     * @param {string} setKey - The key representing the set.
     * @param {string} member - The member to add to the set.
     * @returns {Promise<void>}
     */
    async sadd(setKey: string, member: string): Promise<void> {
      let members = cache.get<string[]>(setKey) ?? [];
      if (!members.includes(member)) {
        members.push(member);
        cache.set(setKey, members);
      }
    },

    /**
     * Retrieves all members of a "set" stored as an array under the specified key.
     * Simulates Redis `SMEMBERS` command.
     *
     * @param {string} setKey - The key representing the set.
     * @returns {Promise<string[]>} Array of set members. Empty if the set does not exist.
     */
    async smembers(setKey: string): Promise<string[]> {
      return cache.get<string[]>(setKey) ?? [];
    },

    /**
     * Removes a member from a "set" stored as an array under the specified key.
     * Simulates Redis `SREM` command.
     *
     * @param {string} setKey - The key representing the set.
     * @param {string} member - The member to remove from the set.
     * @returns {Promise<void>}
     */
    async srem(setKey: string, member: string): Promise<void> {
      let members = cache.get<string[]>(setKey) ?? [];
      members = members.filter((m) => m !== member);
      cache.set(setKey, members);
    },
  };
}
