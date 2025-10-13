export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;

  // For tracking keys by route pattern (set operations)
  sadd(setKey: string, member: string): Promise<void>;
  smembers(setKey: string): Promise<string[]>;
  srem(setKey: string, member: string): Promise<void>;
}

export interface CacheMiddlewareOptions {
  cacheClient: CacheClient;
  ttlSeconds?: number;
}
