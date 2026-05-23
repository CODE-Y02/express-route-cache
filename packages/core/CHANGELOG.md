# @express-route-cache/core

## 1.3.0

### Minor Changes

- 0eb8d29: ### Documentation Site Modernization
  - **Multi-Theme Engine**: Implemented a custom 4-theme architecture (`Ember`, `Thunder`, `Sea`, `Night`) featuring persistent state management, a custom emoji-based Vue switcher, and Flash-of-Unstyled-Content (FOUC) prevention.
  - **Accessibility (WCAG AA) Overhaul**: Decoupled button gradients from text link colors to ensure maximum contrast in Light Mode, while maintaining high-saturation neon aesthetics in Dark Mode. Removed unnecessary strokes/borders from code blocks for cleaner reading.
  - **New Technical Guides**: Authored and published five massive new guides: `Why express-route-cache?`, `Testing`, `Deployment`, `Recipes & Patterns`, and `Standalone Fetch`.
  - **API Reference Fixes**: Resolved 404 dead links in the API documentation that were blocking the build pipeline.

  ### Package SEO & Registry Optimization
  - **NPM Homepage Links**: Repointed the `"homepage"` field in all `package.json` files (`core`, `redis`, `memcached`) directly to the Vitepress documentation site to improve NPM-to-Docs traffic funnels.
  - **README Synchronization**: Audited and completely updated the README files for the `core`, `adapter-redis`, and `adapter-memcached` packages.
    - Added the newly introduced `metrics` and `studio` options to the core API table.
    - Modernized the adapter instantiation examples to use the safer, explicit `{ client: redisClient }` pattern instead of passing connection strings.

  ### AI Integration Context
  - **MCP & LLM Sync**: Updated `ai.json`, `llms.txt`, and `llms-full.txt` to include all the new guide URLs and fixed an outdated `staleTime` type error to ensure AI models generate accurate code snippets.
  - **MCP Server Fix**: Patched the compiled `mcp` server package to query the correct GitHub Pages domain instead of a dead `.js.org` placeholder.

## 1.2.0

### Minor Changes

- feat: distributed stampede/SWR locking, SHA-256 key hashing, binary support
  - Add setNX to CacheClient interface (optional, backward-compatible)
  - Implement setNX in Memory, Redis, Memcached adapters
  - Redis adapter: enableOfflineQueue: false to fail-fast on disconnect
  - Two-tier distributed stampede protection: adapter setNX (cross-server) → LRU fallback (per-process)
  - Two-tier SWR lock: adapter setNX (cross-server) → localSwrLocks Set (per-process fallback)
  - Non-leader servers poll cache via waitForCachePopulation (150ms × 10 = 1.5s max)
  - SHA-256 hash all cache keys (fixes Memcached 250-char limit)
  - Fix binary data corruption in res.write (encoding passthrough)
  - Fix client abort releasing stampede lock (req.on close)
  - Add Buffer base64 serialization in cache.fetch
  - Auto-invalidation uses getRoutePattern directly (removes MGET overhead)
  - SWR background revalidation uses route stack direct execution (Express 5 fix)

## 1.1.0

### Minor Changes

- 273105e: including custom swr and LLM improvements

## 1.0.0

### Major Changes

- Support for auto invalidate & few critical bug fixes

## 0.2.0

### Minor Changes

- e83284d: feat: add `autoInvalidate` option for automatic O(1) route clearing on mutations (POST, PUT, DELETE, PATCH).

  This update also includes critical bug fixes:
  - Fix binary data corruption by using Base64 serialization.
  - Preserve all non-sensitive response headers on cache replay.
  - Respect manual `Cache-Control` headers from handlers.
  - Resolve invalidation race conditions by moving logic to the `res.on('finish')` hook.

## 0.1.3

### Patch Changes

- e610874: - **Fix (Security):** Added `lru-cache` to `inflightRequests` map for Stampede Protection. This enforces a maximum ceiling of 5,000 pending locks, completely neutralizing Denial-Of-Service / Out Of Memory vulnerabilities caused by massive unique-query cache bust attacks.
  - **Fix (Performance):** Fully implemented the Next.js Mock Response pattern for Stale-While-Revalidate (`swr: true`). Previous versions only delayed the miss to the next user. The library now uses `Object.create(res)` to seamlessly execute your Express middleware pipeline in the background and silently dump the fresh data directly into Redis without throwing `ERR_HTTP_HEADERS_SENT` socket errors.
  - **Feature (Safety):** Added `maxBodySize` parameter to `CacheConfig` (defaults to 2MB). Responses larger than this threshold are instantly flushed to the user and bypass the caching layer entirely, protecting Node.js V8 heap limits against stream-buffering massive gigabyte file downloads.

## 0.1.2

### Patch Changes

- ad66ac8: - **Fix**: Reordered `res.setHeader` in internal middleware for cache miss scenarios to prevent `ERR_HTTP_HEADERS_SENT` crashes when requests have been partially flushed.
  - **Fix**: The Redis and Memcached adapters are now much safer to use with shared database connection lifecycle. They correctly recognize when you pass an existing `client` instance (via `ops.client`) and will intentionally "opt-out" of closing the target connection when teardowns occur.
  - **Feature**: Added a new optional `sortQuery` boolean flag (defaults to `false`) to `CacheConfig` & `RouteOptions`. When enabled, this sorts query parameter names lexicographically (e.g., `?a=1&b=2` equals `?b=2&a=1`) before generating caching hashes to ensure identical API requests have deterministic, hit-producing keys.

## 0.1.1

### Patch Changes

- Update documentation across all packages with detailed READMEs.

## 0.1.0

### Minor Changes

- TanStack-inspired route cache with O(1) epoch invalidation, SWR, stampede protection, and adapter pattern
