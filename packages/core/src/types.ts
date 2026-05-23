import type { Request, Response, NextFunction } from "express";

// ─── Cache Client Interface (Adapter Contract) ─────────────────────────────

/**
 * The universal cache client interface that all adapters must implement.
 * Intentionally minimal: basic KV + `incr` for epochs + `mget` for batch reads.
 * No Set operations (sadd/smembers) — keeps Memcached fully compatible.
 */
export interface CacheClient {
  /** Retrieve a cached value by key. Returns `null` on miss. */
  get(key: string): Promise<string | null>;

  /** Batch-retrieve multiple keys. Returns array in same order, `null` for misses. */
  mget(keys: string[]): Promise<(string | null)[]>;

  /** Store a value with optional TTL in seconds. */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  /** Delete one or more keys. */
  del(...keys: string[]): Promise<void>;

  /** Atomically increment a numeric key (creates with value 1 if missing). Returns new value. */
  incr(key: string): Promise<number>;

  /** Optional cleanup/disconnect hook. */
  disconnect?(): Promise<void>;
}

// ─── Cache Entry (what we store in the cache) ───────────────────────────────

/** Internal structure stored as JSON string in the cache. */
export interface CacheEntry {
  /** The serialized response body. */
  body: string;
  /** HTTP status code of the original response. */
  statusCode: number;
  /** Response headers to replay (content-type, etc). */
  headers: Record<string, string>;
  /** Unix timestamp (ms) when this entry was created. */
  createdAt: number;
  /** Whether the body is base64 encoded. */
  isBase64?: boolean;
}

/** Generic structure for manual fetch caching. */
export interface DataEntry<T = any> {
  data: T;
  createdAt: number;
}

// ─── Configuration Types ────────────────────────────────────────────────────

/**
 * Global configuration passed to `createCache()`.
 * Inspired by TanStack Query's option model.
 */
export interface CacheConfig {
  /** The cache adapter instance (memory, Redis, Memcached, etc). */
  adapter: CacheClient;

  /**
   * How long (seconds) data is considered **fresh**.
   * During this window, cached data is returned instantly.
   * @default 60
   */
  staleTime?: number;

  /**
   * How long (seconds) **stale** data is kept before eviction.
   * Total TTL in cache = staleTime + gcTime.
   * @default 300
   */
  gcTime?: number;

  /**
   * Stale-While-Revalidate. When `true`, stale data is served instantly
   * while the handler re-executes in the background to refresh the cache.
   * When `false`, stale data is treated as a cache miss.
   * @default false
   */
  swr?: boolean;

  /**
   * Enable stampede / thundering-herd protection.
   * When `true`, concurrent requests for the same cache key coalesce
   * into a single handler execution.
   * @default true
   */
  stampede?: boolean;

  /**
   * Cache key namespace prefix.
   * @default "erc:"
   */
  keyPrefix?: string;

  /**
   * Request headers whose values should be included in the cache key,
   * enabling user-specific or variant-specific caching.
   * Example: `['authorization']` to cache per-user.
   * @default []
   */
  vary?: string[];

  /**
   * Whether caching is enabled globally.
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to sort query parameter keys before hashing.
   * Enables deterministic cache keys for identical requests with different param order.
   * (e.g., `?a=1&b=2` equals `?b=2&a=1`)
   * @default false
   */
  sortQuery?: boolean;

  /**
   * Maximum response body size (in bytes) to cache. 
   * Protects Node.js memory limits during large streaming downloads.
   * If a response exceeds this size, it serves normally but skips the cache.
   * @default 2097152 (2MB)
   */
  maxBodySize?: number;

  /**
   * Automatically invalidate the cache for the current route pattern 
   * when a mutation request (POST, PUT, DELETE, PATCH) is successful.
   * @default false
   */
  autoInvalidate?: boolean;

  /**
   * Number of times to retry a failed fetch before giving up.
   * @default 0
   */
  retry?: number;
}

/**
 * Per-route options passed to `cache.route()`.
 * Overrides global CacheConfig for the specific route.
 */
export interface RouteOptions {
  staleTime?: number;
  gcTime?: number;
  swr?: boolean;
  enabled?: boolean;
  vary?: string[];
  sortQuery?: boolean;
  maxBodySize?: number;
  autoInvalidate?: boolean;
  retry?: number;
  /** Custom cache key override. If provided, used instead of auto-generated key. */
  key?: string | ((req: Request) => string);
}

/** The object returned by `createCache()`. */
export interface CacheInstance {
  /** Global middleware — caches all GET routes. Use with `app.use()`. */
  middleware: () => ExpressMiddleware;

  /** Per-route middleware — use as `router.get('/path', cache.route(), handler)`. */
  route: (opts?: RouteOptions) => ExpressMiddleware;

  /** Invalidation middleware — use as `router.post('/path', cache.invalidate('/path'), handler)`. */
  invalidate: (...routePatterns: string[]) => ExpressMiddleware;

  /** Programmatic invalidation — call from anywhere (service layer, cron, webhook). */
  invalidateRoute: (...routePatterns: string[]) => Promise<void>;

  /** Standalone fetch with SWR and Stampede protection. */
  fetch: <T>(
    key: string,
    fetcher: () => Promise<T>,
    opts?: Omit<RouteOptions, "key" | "autoInvalidate" | "vary" | "sortQuery">
  ) => Promise<T>;

  /** Access the underlying adapter. */
  adapter: CacheClient;
}

/** Standard Express middleware signature. */
export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
