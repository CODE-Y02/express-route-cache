---
title: "HTTP Header Preservation in Cached Express Responses | @express-route-cache"
description: "How express-route-cache preserves CORS headers, Content-Type, and custom HTTP headers in cached responses. Includes X-Cache debug headers and vary-based cache namespacing."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/headers
  - - meta
    - property: og:title
      content: "HTTP Header Preservation for Express.js Caching | @express-route-cache"
  - - meta
    - property: og:description
      content: "Preserve CORS, Content-Type, and custom headers in cached Express.js responses. Debug with X-Cache HIT/MISS/STALE headers."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/headers
---

# Header Preservation

`@express-route-cache` ensures that your cached responses are high-fidelity replays of the original, including all relevant HTTP headers.

## Automatic Preservation

The following are automatically captured and replayed:
- **CORS Headers**: `Access-Control-Allow-Origin`, etc.
- **Content-Type**: Ensures the client knows how to parse the data.
- **Custom Headers**: Any headers your middleware or handlers set.

## Excluded Headers

We intentionally strip ephemeral or session-specific headers to prevent security issues or incorrect behavior:
- `Set-Cookie`
- `X-Express-*` internal headers
- `Connection`, `Keep-Alive`, etc.

## Cache Visibility Headers

We add our own headers to help you debug and monitor cache performance:

- `X-Cache`: `HIT` | `MISS` | `STALE`
- `Age`: Time in seconds since the cache entry was created.
- `Cache-Control`: Automatically calculated based on your `staleTime`.

## Customizing Cache Identity (`vary`)

If your response changes based on a header (like `Authorization` or `Accept-Language`), use the `vary` option:

```ts
const cache = createCache({
  vary: ['authorization', 'accept-language'],
});
```

This ensures that different users get their own private cached versions of the data.
