---
title: "Caching Binary Data (Images, PDFs, Buffers) in Express.js | @express-route-cache"
description: "How express-route-cache handles binary responses — images, PDFs, ZIP files, and Buffers — using automatic Base64 serialization. No data corruption."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/binary-support
  - - meta
    - property: og:title
      content: "Binary Caching Support in Express.js | @express-route-cache"
  - - meta
    - property: og:description
      content: "Cache images, PDFs, and binary buffers in Express.js. Automatic Base64 serialization prevents data corruption in Redis and Memcached."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/binary-support
---

# Binary Support

Unlike many Express caching libraries that only handle JSON, `@express-route-cache` has first-class support for binary data.

## Supported Formats

You can cache any response that Express can send, including:
- **Images** (PNG, JPEG, SVG)
- **PDFs**
- **Zipped files**
- **Buffers**
- **Streams** (Buffered up to `maxBodySize`)

## How it works

We intercept the response chunks and determine if the body is binary. If it is, we use **Base64 serialization** to store it safely in your adapter (Redis, Memcached, or Memory). When serving a cache HIT, we decode it back to its original binary format.

## Configuration

### `maxBodySize`

To prevent Out-Of-Memory (OOM) issues, we limit the size of responses that can be cached.

```ts
const cache = createCache({
  maxBodySize: 2 * 1024 * 1024, // 2MB (Default)
});
```

If a response exceeds this size, caching is automatically aborted for that request to protect your server's memory.
