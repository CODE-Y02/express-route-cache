---
layout: home

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
    alt: express-route-cache Logo
  actions:
    - theme: brand
      text: Get Started
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
  - icon: 📜
    title: Header Preservation
    details: Automatically preserves CORS, custom headers, and response metadata for a perfect replay.
  - icon: 🛠️
    title: Standalone Fetch
    details: Manual data caching with full SWR and Stampede Protection. Not just for Express routes.
  - icon: 🔁
    title: Built-in Retries
    details: Exponential backoff retries for your data fetchers. Handle flaky APIs with ease.
---

### 🚀 Why express-route-cache?

Existing Express caching middlewares often fail in production because they lack critical features like efficient invalidation or background refreshing. `@express-route-cache` solves these by bringing modern data-fetching patterns to the server.

- **Zero Configuration**: Sensible defaults that work out of the box.
- **Enterprise Ready**: Designed for high-throughput, distributed environments.
- **Developer Experience**: Modern TypeScript API with predictable behavior.
- **Performance First**: O(1) operations ensure your Node.js event loop stays responsive.

### 🛠 Built With

TypeScript · Express.js · Redis · Memcached · Ioredis · Memjs

---

### ❤️ Support the Project

If `@express-route-cache` has saved you time, please consider giving us a star on [GitHub](https://github.com/CODE-Y02/express-route-cache)! It helps us reach more developers and continue improving the project.
