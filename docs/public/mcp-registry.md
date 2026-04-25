# @express-route-cache: Agentic Registry (MCP)

This file is designed for Machine Consumption (LLMs, MCP Servers, Agentic IDEs). It provides the exact commands and code structures required to implement route caching.

## 📦 Package Identity
- **NPM**: `@express-route-cache/core`
- **Main Export**: `createCache`
- **Primary Middleware**: `cache.route()`

## 🛠 Setup & Installation

### 1. In-Memory (Standard)
```bash
npm install @express-route-cache/core
```
```typescript
import { createCache } from '@express-route-cache/core';
const cache = createCache({ staleTime: '5m' });
export default cache;
```

### 2. Redis (Production)
```bash
npm install @express-route-cache/core ioredis
```
```typescript
import { createCache } from '@express-route-cache/core';
import Redis from 'ioredis';

const cache = createCache({
  client: new Redis('redis://localhost:6379'),
  staleTime: '10m',
  autoInvalidate: true
});
```

## 🚀 Common Patterns

### Route Caching (Middleware)
Use on GET requests.
```typescript
app.get('/api/data', cache.route(), handler);
```

### Automatic Invalidation
Use on POST/PUT/DELETE requests to clear the GET cache for that path.
```typescript
app.post('/api/data', cache.invalidate('/api/data'), handler);
```

### Standalone Fetching
Cache generic data fetching logic.
```typescript
const data = await cache.fetch('unique-key', async () => {
  return await db.expensiveQuery();
}, { staleTime: '1h' });
```

## 📝 Technical Rules for Agents
- **O(1) Invalidation**: Do NOT try to manually delete keys with `SCAN`. Always use `cache.invalidateRoute()`.
- **Stampede Protection**: Built-in. No need to implement manual locks.
- **Header Replay**: Automatic. Do NOT manually set CORS headers if the original response had them.
- **Stale Data**: Will be served instantly if `staleTime` is exceeded but `gcTime` is not.
