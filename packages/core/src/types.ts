/**
 * Interface representing a cache client with basic get/set/del operations,
 * and Redis-like set operations for tracking cache keys by route pattern.
 */
export interface CacheClient {
  /**
   * Retrieve a cached value by key.
   * @param key - The cache key.
   * @returns A promise resolving to the cached string value or null if not found.
   */
  get(key: string): Promise<string | null>;

  /**
   * Store a value in the cache with an optional TTL.
   * @param key - The cache key.
   * @param value - The string value to store.
   * @param ttlSeconds - Optional time-to-live in seconds.
   */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  /**
   * Delete one or more keys from the cache.
   * @param keys - One or more cache keys to delete.
   */
  del(...keys: string[]): Promise<void>;

  /**
   * Add a member to a set stored under a given key.
   * Used for tracking keys associated with route patterns.
   * @param setKey - The key representing the set.
   * @param member - The member to add to the set.
   */
  sadd(setKey: string, member: string): Promise<void>;

  /**
   * Retrieve all members of a set stored under a given key.
   * @param setKey - The key representing the set.
   * @returns A promise resolving to an array of members in the set.
   */
  smembers(setKey: string): Promise<string[]>;

  /**
   * Remove a member from a set stored under a given key.
   * @param setKey - The key representing the set.
   * @param member - The member to remove from the set.
   */
  srem(setKey: string, member: string): Promise<void>;
}

/**
 * Options for cache middleware creation.
 */
export interface CacheMiddlewareOptions {
  /** The cache client instance to use */
  cacheClient: CacheClient;

  /** Time-to-live for cached items in seconds. Optional, defaults to implementation default */
  ttlSeconds?: number;
}
