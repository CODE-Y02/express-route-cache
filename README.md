# express-route-cache Monorepo

Monorepo for `express-route-cache` and its extensions.

## Packages

- `express-route-cache`: Core caching middleware with in-memory `node-cache`.
- `@express-route-cache/redis`: Redis adapter for distributed caching.

## Setup (Development)

```bash
npm install
```

## Structure

```dir
express-route-cache-monorepo/
├── packages/
│   ├── core/  # express-route-cache
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── nodeCacheClient.ts
│   │   │   ├── cacheMiddleware.ts
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.esm.json
│   ├── redis/  # @express-route-cache/redis
│   │   ├── src/
│   │   │   ├── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.esm.json
├── example/
│   ├── app.ts
├── package.json
├── tsconfig.json
├── .gitignore
├── .npmignore
├── README.md
```
