---
title: "Deployment | @express-route-cache"
description: "How to configure @express-route-cache for production: Docker, Kubernetes, PM2 clusters, health checks, and environment-aware setup."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/deployment
  - - meta
    - property: og:title
      content: "Deployment | @express-route-cache"
  - - meta
    - property: og:description
      content: "How to configure @express-route-cache for production: Docker, Kubernetes, PM2 clusters, health checks, and environment-aware setup."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/deployment
---

# Deployment

This guide covers production deployment patterns — from a single-server Docker setup to multi-pod Kubernetes clusters.

## Environment-Aware Configuration

The recommended pattern is to drive your adapter choice from environment variables. This lets you use the Memory adapter locally and Redis in production with no code changes:

```ts
// cache.ts
import { createCache, createMemoryAdapter } from '@express-route-cache/core';
import { createRedisAdapter } from '@express-route-cache/redis';

function createAdapter() {
  if (process.env.REDIS_URL) {
    return createRedisAdapter({ url: process.env.REDIS_URL });
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Using in-process Memory adapter in production. Set REDIS_URL for distributed caching.');
  }
  return createMemoryAdapter();
}

export const cache = createCache({
  adapter: createAdapter(),
  staleTime: 60,
  gcTime: 300,
  swr: true,
  metrics: true,  // Enable for health endpoint
});
```

---

## Docker / Docker Compose

A typical two-container setup:

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Your Express app picks up `REDIS_URL` automatically using the pattern above — no other changes needed.

---

## Kubernetes

Set `REDIS_URL` from a Kubernetes Secret:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 4  # Multiple pods share the same Redis cache
  template:
    spec:
      containers:
        - name: api
          env:
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
```

> [!IMPORTANT]
> Always use the **Redis adapter** in Kubernetes. With 4 pods and the Memory adapter, each pod has its own isolated cache — invalidation on Pod A will not affect Pods B, C, or D.

### Redis in Kubernetes (without external Redis)

If you don't have a managed Redis service, deploy Redis as a StatefulSet:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis --set auth.enabled=false
```

Then set `REDIS_URL=redis://redis-master.default.svc.cluster.local:6379`.

---

## PM2 Cluster Mode

PM2 cluster mode forks multiple Node.js processes on the same machine. Each fork has its own heap — the Memory adapter will not be shared. Always use Redis with PM2 clusters:

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: './dist/server.js',
    instances: 'max',  // One per CPU core
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      REDIS_URL: 'redis://localhost:6379',
    },
  }],
};
```

---

## Health Check Endpoint

Expose `cache.metrics` in a health endpoint so your load balancer and monitoring systems can observe cache performance:

```ts
import { cache } from './cache';

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    cache: {
      metricsEnabled: !!cache.metrics,
      ...cache.metrics,  // hits, misses, swrHits, swrFailures, etc.
    },
  });
});
```

Example response:
```json
{
  "status": "ok",
  "cache": {
    "metricsEnabled": true,
    "hits": 14823,
    "misses": 312,
    "swrHits": 89,
    "swrFailures": 2,
    "stampedeCoalesces": 41,
    "stampedePolls": 18
  }
}
```

> [!NOTE]
> `cache.metrics` is `undefined` unless you set `metrics: true` in `createCache()`.

---

## Cache Studio in Production

Use the standalone Studio server on an internal port, not exposed to the public internet:

```ts
const cache = createCache({
  adapter: createRedisAdapter({ url: process.env.REDIS_URL }),
  metrics: true,
  studio: {
    port: 3001,       // Internal port — do not expose publicly
    path: '/studio',
    hostname: 'localhost',
  },
});
```

In Kubernetes, expose port 3001 only within the cluster (ClusterIP service), then use `kubectl port-forward` to access it from your local machine:

```bash
kubectl port-forward deploy/api 3001:3001
# Now open http://localhost:3001/studio
```

---

## Graceful Shutdown

Disconnect the Redis adapter cleanly on SIGTERM to avoid connection leaks:

```ts
import { cache } from './cache';

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await cache.adapter.disconnect?.();
  process.exit(0);
});
```

> [!NOTE]
> `disconnect()` is optional on the `CacheClient` interface — it exists on the Redis and Memcached adapters but not on the Memory adapter. The optional chaining `?.` handles this safely.

---

## Recommended Production Config

```ts
export const cache = createCache({
  adapter: createRedisAdapter({
    url: process.env.REDIS_URL!,
    options: {
      enableOfflineQueue: false,  // Don't queue commands if Redis is down
      connectTimeout: 5000,       // 5s connection timeout
      maxRetriesPerRequest: 2,
    },
  }),
  staleTime: 60,         // 1 minute fresh
  gcTime: 3600,          // Keep stale for 1 hour
  swr: true,             // Serve stale, refresh in background
  stampede: true,        // Default — keep enabled
  maxBodySize: 5_242_880, // 5MB max response size
  metrics: true,         // Required for health endpoint + Studio
  studio: {
    port: parseInt(process.env.STUDIO_PORT || '3001'),
  },
});
```
