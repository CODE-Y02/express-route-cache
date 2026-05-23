---
title: "Header Preservation | @express-route-cache"
description: "How we replay CORS and custom headers to ensure your API behaves identically when cached."
---

# Header Preservation

`@express-route-cache` ensures that your cached responses are high-fidelity replays of the original, including all relevant HTTP headers.

## Automatic Preservation

The following are automatically captured and replayed on every cache HIT:
- **CORS Headers**: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, etc.
- **Content-Type**: Ensures the client knows how to parse the data.
- **Custom Headers**: Any headers your middleware or handlers set.

## Excluded Headers

We intentionally strip ephemeral or session-specific headers to prevent security issues or incorrect behavior:
- `Set-Cookie` — cookies must not be replayed from a shared cache
- `X-Express-*` — internal Express framework headers

All other headers are preserved and replayed as-is.

## Cache Visibility Headers

We add our own headers to help you debug and monitor cache performance:

- `X-Cache`: `HIT` | `MISS` | `STALE`
- `Age`: Time in seconds since the cache entry was created.
- `Cache-Control`: Automatically calculated based on your `staleTime` (only set if your handler has not set its own `Cache-Control` header).

```bash
# Inspect cache headers with curl
curl -I http://localhost:3000/api/data

# Example output for a cache HIT:
# X-Cache: HIT
# Age: 42
# Cache-Control: public, max-age=18
```

## Customizing Cache Identity (`vary`)

If your response changes based on a header (like `Authorization` or `Accept-Language`), use the `vary` option to create per-user or per-locale cache partitions:

```ts
const cache = createCache({
  vary: ['authorization', 'accept-language'],
});
```

This ensures that different users (or locales) each get their own private cached version of the data.
