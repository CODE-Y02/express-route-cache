import { CacheClient } from "../types";

export function createRedisCacheClient(redisClient: any): CacheClient {
  if (!redisClient) {
    throw new Error(
      "redisClient is required. Install 'ioredis' with `npm install ioredis`."
    );
  }
  return {
    get(key) {
      return redisClient.get(key);
    },

    async set(key, value, ttlSeconds) {
      if (ttlSeconds) {
        await redisClient.set(key, value, "EX", ttlSeconds);
      } else {
        await redisClient.set(key, value);
      }
    },

    async del(...keys) {
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    },

    async sadd(setKey, member) {
      await redisClient.sadd(setKey, member);
    },

    async smembers(setKey) {
      return await redisClient.smembers(setKey);
    },

    async srem(setKey, member) {
      await redisClient.srem(setKey, member);
    },
  };
}
