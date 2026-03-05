# @express-route-cache/memcached

> Memcached adapter for `@express-route-cache/core`.

## Installation

```bash
npm install @express-route-cache/memcached memjs
```

## Usage

```ts
import { createCache } from "@express-route-cache/core";
import { createMemcachedAdapter } from "@express-route-cache/memcached";

const cache = createCache({
  adapter: createMemcachedAdapter({
    servers: "localhost:11211",
    // OR pass memjs options
    options: {
      retries: 2,
    },
  }),
  staleTime: 60,
});
```

## Features

- **Atomic Increments**: Uses Memcached `incr` for O(1) invalidation.
- **Lightweight**: Optimized for simple, high-throughput key-value storage.
- **Binary Friendly**: Correctly handles serialized response buffers.
- **Safe Lifecycle Management**: If you pass an existing `client` instance, the adapter will _never_ call `.close()` on it when tearing down, ensuring it won't kill connections shared by the rest of your app.

## Documentation

For full configuration options and caching logic, see the [Core Documentation](https://github.com/CODE-Y02/express-route-cache/tree/main/packages/core).

## License

MIT
