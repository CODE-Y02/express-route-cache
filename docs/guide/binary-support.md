---
title: "Binary Support | @express-route-cache"
description: "Learn how we handle Images, PDFs, and ZIP files using automatic Base64 serialization."
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
