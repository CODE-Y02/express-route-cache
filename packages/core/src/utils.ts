import crypto from "crypto";
import type { Request } from "express";
import type { CacheClient, CacheEntry } from "./types";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Epoch key prefix used for O(1) invalidation counters. */
const EPOCH_PREFIX = "epoch:";

// ─── Route Helpers ──────────────────────────────────────────────────────────

/**
 * Extract the route pattern from a request.
 * Works with all Express route patterns: static, parameterized, wildcard, regex, arrays.
 */
export function getRoutePattern(req: Request): string {
  if (req.route) {
    // req.route.path may be a string, regex, or array
    const routePath = req.route.path;
    if (routePath instanceof RegExp) {
      return `${req.baseUrl}/__regex__${routePath.source}`;
    }
    if (Array.isArray(routePath)) {
      return `${req.baseUrl}${routePath[0]}`;
    }
    return `${req.baseUrl}${routePath}`;
  }
  // Fallback: use the path portion of the URL
  return req.path;
}

/**
 * Given a route pattern string, returns all ancestor routes including itself.
 * This is the foundation of automatic route-tree invalidation.
 *
 * @example
 * getParentRoutePatterns('/api/users/:id/posts')
 * // => ['/api', '/api/users', '/api/users/:id', '/api/users/:id/posts']
 */
export function getParentRoutePatterns(route: string): string[] {
  const segments = route.split("/").filter(Boolean);
  const patterns: string[] = [];

  for (let i = 1; i <= segments.length; i++) {
    patterns.push("/" + segments.slice(0, i).join("/"));
  }
  return patterns;
}

// ─── Epoch Key Helpers ──────────────────────────────────────────────────────

/** Get the epoch storage key for a route pattern. */
export function getEpochKey(routePattern: string): string {
  return `${EPOCH_PREFIX}${routePattern}`;
}

/**
 * Fetch current epoch values for a list of route patterns.
 * Uses `mget` for batch efficiency. Missing epochs default to "0".
 */
export async function fetchEpochs(
  client: CacheClient,
  patterns: string[]
): Promise<number[]> {
  if (patterns.length === 0) return [];
  const keys = patterns.map(getEpochKey);
  const values = await client.mget(keys);
  return values.map((v) => (v !== null ? parseInt(v, 10) || 0 : 0));
}

// ─── Versioned Cache Key ────────────────────────────────────────────────────

/**
 * Build a versioned cache key that incorporates epoch versions.
 * This is the core of O(1) invalidation: when any epoch increments,
 * the key changes → automatic cache miss → old entries expire via gcTime.
 *
 * Key structure:
 *   `{prefix}GET:/users/123?{queryHash}|v:/users=0|v:/users/:id=3`
 */
export function buildVersionedKey(opts: {
  prefix: string;
  method: string;
  routePattern: string;
  url: string;
  query: Record<string, unknown>;
  epochs: number[];
  parentPatterns: string[];
  vary?: string[];
  varyValues?: Record<string, string>;
}): string {
  const {
    prefix,
    method,
    url,
    query,
    epochs,
    parentPatterns,
    vary,
    varyValues,
  } = opts;

  // Query hash (deterministic)
  const queryKeys = Object.keys(query);
  const queryHash = queryKeys.length
    ? crypto.createHash("md5").update(JSON.stringify(query)).digest("hex")
    : "";

  // Epoch version segments
  const versionSegments = parentPatterns
    .map((p, i) => `v:${p}=${epochs[i]}`)
    .join("|");

  // Vary segments (for user-specific caching)
  let varySegment = "";
  if (vary?.length && varyValues) {
    varySegment =
      "|" +
      vary
        .map((h) => `vary:${h}=${varyValues[h] || ""}`)
        .join("|");
  }

  return `${prefix}${method}:${url}${queryHash ? `?${queryHash}` : ""}|${versionSegments}${varySegment}`;
}

/**
 * Build the full versioned cache key for a request.
 * Fetches epochs from the cache and constructs the key.
 */
export async function buildCacheKey(
  client: CacheClient,
  req: Request,
  prefix: string,
  vary?: string[]
): Promise<{ key: string; routePattern: string; parentPatterns: string[] }> {
  const routePattern = getRoutePattern(req);
  const parentPatterns = getParentRoutePatterns(routePattern);
  const epochs = await fetchEpochs(client, parentPatterns);

  // Extract vary header values
  const varyValues: Record<string, string> = {};
  if (vary?.length) {
    for (const header of vary) {
      varyValues[header] = (req.get(header) || "").toLowerCase();
    }
  }

  const key = buildVersionedKey({
    prefix,
    method: req.method,
    routePattern,
    url: req.originalUrl || req.url,
    query: req.query as Record<string, unknown>,
    epochs,
    parentPatterns,
    vary,
    varyValues,
  });

  return { key, routePattern, parentPatterns };
}

// ─── Cache Entry Helpers ────────────────────────────────────────────────────

/** Serialize a CacheEntry to a JSON string for storage. */
export function serializeEntry(entry: CacheEntry): string {
  return JSON.stringify(entry);
}

/** Deserialize a JSON string back to a CacheEntry. Returns null on failure. */
export function deserializeEntry(raw: string): CacheEntry | null {
  try {
    const parsed = JSON.parse(raw) as CacheEntry;
    if (parsed && typeof parsed.createdAt === "number" && parsed.body !== undefined) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Determine the freshness state of a cache entry.
 * Returns: 'fresh' | 'stale' | 'expired'
 */
export function getFreshness(
  entry: CacheEntry,
  staleTime: number,
  gcTime: number
): "fresh" | "stale" | "expired" {
  const ageMs = Date.now() - entry.createdAt;
  const ageSeconds = ageMs / 1000;

  if (ageSeconds < staleTime) return "fresh";
  if (ageSeconds < staleTime + gcTime) return "stale";
  return "expired";
}

/** Calculate the age of a cache entry in seconds. */
export function getAgeSeconds(entry: CacheEntry): number {
  return Math.floor((Date.now() - entry.createdAt) / 1000);
}
