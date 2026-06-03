# @express-route-cache/redis

## 1.1.0-next.0

### Minor Changes

- feat: support dynamic enabled callback and caching of non-GET routes with type-safe generateCacheKey helper

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@2.1.0-next.0

## 1.0.0

### Major Changes

- a295b9d: Welcome to v2.0.0! This major release solidifies the caching API, introduces the new Cache Studio interface, and finalizes the documentation overhaul.

### Patch Changes

- Updated dependencies [a295b9d]
  - @express-route-cache/core@2.0.0

## 0.4.0

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

### Patch Changes

- Updated dependencies [0eb8d29]
  - @express-route-cache/core@1.3.0

## 0.3.0

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

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@1.2.0

## 0.2.1

### Patch Changes

- Updated dependencies [273105e]
  - @express-route-cache/core@1.1.0

## 0.2.0

### Minor Changes

- Support for auto invalidate & few critical bug fixes

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@1.0.0

## 0.1.4

### Patch Changes

- e83284d: feat: add `autoInvalidate` option for automatic O(1) route clearing on mutations (POST, PUT, DELETE, PATCH).

  This update also includes critical bug fixes:
  - Fix binary data corruption by using Base64 serialization.
  - Preserve all non-sensitive response headers on cache replay.
  - Respect manual `Cache-Control` headers from handlers.
  - Resolve invalidation race conditions by moving logic to the `res.on('finish')` hook.

- Updated dependencies [e83284d]
  - @express-route-cache/core@0.2.0

## 0.1.3

### Patch Changes

- Updated dependencies [e610874]
  - @express-route-cache/core@0.1.3

## 0.1.2

### Patch Changes

- ad66ac8: - **Fix**: Reordered `res.setHeader` in internal middleware for cache miss scenarios to prevent `ERR_HTTP_HEADERS_SENT` crashes when requests have been partially flushed.
  - **Fix**: The Redis and Memcached adapters are now much safer to use with shared database connection lifecycle. They correctly recognize when you pass an existing `client` instance (via `ops.client`) and will intentionally "opt-out" of closing the target connection when teardowns occur.
  - **Feature**: Added a new optional `sortQuery` boolean flag (defaults to `false`) to `CacheConfig` & `RouteOptions`. When enabled, this sorts query parameter names lexicographically (e.g., `?a=1&b=2` equals `?b=2&a=1`) before generating caching hashes to ensure identical API requests have deterministic, hit-producing keys.
- Updated dependencies [ad66ac8]
  - @express-route-cache/core@0.1.2

## 0.1.1

### Patch Changes

- Update documentation across all packages with detailed READMEs.
- Updated dependencies
  - @express-route-cache/core@0.1.1

## 0.1.0

### Minor Changes

- TanStack-inspired route cache with O(1) epoch invalidation, SWR, stampede protection, and adapter pattern

### Patch Changes

- Updated dependencies
  - @express-route-cache/core@0.1.0
