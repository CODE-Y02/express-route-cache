---
title: "Binary Support | @express-route-cache"
description: "Cache images, PDFs, ZIP files and any binary response with automatic Base64 serialization — no configuration needed."
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

Unlike many Express caching libraries that only handle JSON, `@express-route-cache` has first-class support for binary data. Images, PDFs, ZIP files — if Express can send it, the cache can store it.

## How It Works

The middleware intercepts the raw response bytes and detects whether the body is binary. If it is, the body is **Base64-encoded** before storing in the adapter (Redis, Memcached, or Memory) and decoded back to its original bytes when serving a cache HIT.

A flag (`isBase64: true`) is stored alongside the entry so the cache knows to decode it on retrieval.

## Supported Response Types

| Response Method | Binary-Safe? |
| :--- | :---: |
| `res.json(...)` | ✅ (JSON) |
| `res.send(Buffer)` | ✅ |
| `res.sendFile(path)` | ✅ |
| `res.download(path)` | ✅ |
| Stream piped to `res` | ✅ (buffered up to `maxBodySize`) |

## Example: Caching an Image Endpoint

```ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createCache, createMemoryAdapter } from '@express-route-cache/core';

const app = express();
const cache = createCache({
  adapter: createMemoryAdapter(),
  staleTime: 3600,  // Images don't change often — 1 hour fresh
  gcTime: 86400,    // Keep stale for 24 hours
  swr: true,
});

// This route sends a PNG — the cache stores it as Base64 and replays it perfectly
app.get('/images/:name', cache.route(), (req, res) => {
  const imgPath = path.join(__dirname, 'public/images', req.params.name);
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(imgPath);
});
```

On first request: `X-Cache: MISS` — image read from disk and cached.  
On subsequent requests: `X-Cache: HIT` — image served from cache in memory, zero disk I/O.

## Example: Caching a PDF Generation Endpoint

```ts
app.get('/api/invoices/:id/pdf',
  cache.route({
    staleTime: 300,         // Cache for 5 minutes
    maxBodySize: 10_485_760, // Allow up to 10MB PDFs
  }),
  async (req, res) => {
    const pdf = await generateInvoicePDF(req.params.id); // returns Buffer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdf);
  }
);
```

The response headers (`Content-Type`, `Content-Disposition`) are preserved and replayed on every cache HIT.

## Memory Protection: `maxBodySize`

To prevent large files from consuming all available memory (or filling up Redis), set `maxBodySize`. If a response exceeds this limit, caching is **silently skipped** for that request — the response is served normally but not stored.

```ts
const cache = createCache({
  maxBodySize: 2 * 1024 * 1024, // 2MB limit (default)
});

// Override per-route for a large-file endpoint
app.get('/api/exports/:id', cache.route({
  maxBodySize: 50 * 1024 * 1024, // Allow up to 50MB for exports
}), generateExport);
```

| File Size | Default Behaviour |
| :--- | :--- |
| ≤ 2MB | Cached normally |
| > 2MB | Skipped — served fresh, not cached |

> [!TIP]
> For very large files that should never be cached, set `maxBodySize: 0` on the route to always bypass the cache.
