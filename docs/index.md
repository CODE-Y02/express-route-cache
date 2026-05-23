---
layout: home
sidebar: false

head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/
  - - meta
    - property: og:title
      content: "@express-route-cache | O(1) Route Caching for Express.js"
  - - meta
    - property: og:description
      content: "Production-grade Express.js route caching with O(1) invalidation, SWR background refresh, and Stampede Protection. Redis, Memcached & Memory adapters."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/
  - - meta
    - name: twitter:title
      content: "@express-route-cache | O(1) Route Caching for Express.js"
  - - meta
    - name: twitter:description
      content: "Drop-in Express.js caching middleware: O(1) invalidation, SWR, Stampede Protection. Works with Redis, Memcached, and Memory."

hero:
  name: "@express-route-cache"
  text: TanStack Query for the Backend.
  tagline: Production-grade, drop-in route caching for Express.js with O(1) invalidation, SWR, and Stampede Protection.
  image:
    src: /logo.svg
    alt: express-route-cache
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: ⭐ Star on GitHub
      link: https://github.com/CODE-Y02/express-route-cache

features:
  - icon: ⚡
    title: O(1) Invalidation
    details: Instant, zero-blocking invalidation via Epoch Versioning. No more scanning millions of Redis keys.
  - icon: 🔄
    title: Stale-While-Revalidate
    details: Serve stale data instantly while refreshing the cache in the background. Keep your APIs fast always.
  - icon: 🛡️
    title: Stampede Protection
    details: Request coalescing prevents "thundering herds" from melting your database during cache misses.
  - icon: 📦
    title: Multi-Adapter Support
    details: First-class support for Memory, Redis (ioredis), and Memcached (memjs) with a unified API.
  - icon: 🖼️
    title: Binary Support
    details: Cache images, PDFs, and ZIP files perfectly. Automatic Base64 serialization for non-JSON data.
  - icon: 📊
    title: Visual Dashboard
    details: Monitor hits, misses, and SWR revalidations in real-time with the Cache Studio visual dashboard.
---

<div class="custom-home-content">
  <div class="code-showcase">
    <h2>Less boilerplate. More speed.</h2>
    <p>O(1) invalidation and Stale-While-Revalidate means your APIs stay blazingly fast without the nightmare of managing stale keys or writing manual cache-busting logic.</p>
    
```ts
import { createCache } from '@express-route-cache/core';
import { createRedisAdapter } from '@express-route-cache/redis';

const cache = createCache({
adapter: createRedisAdapter({ url: process.env.REDIS_URL }),
staleTime: 60, // Serve fresh for 60s
swr: true, // Serve stale instantly, refresh in bg
});

// Cache this slow endpoint
app.get('/api/reports', cache.route(), generateReport);

// Auto-invalidate when new data is added
app.post('/api/reports', cache.route({ autoInvalidate: true }), addReport);
```

<div class="showcase-cta">
  <a class="VPButton brand" href="./guide/getting-started">Read the Quick Start →</a>
</div>
  </div>
</div>
