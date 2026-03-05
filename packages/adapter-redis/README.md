# @express-route-cache/redis

> Redis adapter for `@express-route-cache/core`.

## Installation

```bash
npm install @express-route-cache/redis ioredis
```

## Usage

```ts
import { createCache } from "@express-route-cache/core";
import { createRedisAdapter } from "@express-route-cache/redis";

const cache = createCache({
  adapter: createRedisAdapter({
    url: "redis://localhost:6379",
    // OR pass ioredis options
    options: {
      password: "auth",
    },
  }),
  staleTime: 60,
});
```

## Features

- **High Performance**: Uses native Redis `MGET`, `SET EX`, and `INCR` commands.
- **Distributed**: Perfect for multi-instance Express applications.
- **Flexible**: Accepts connection strings, `ioredis` options, or an existing `ioredis` instance.
- **Safe Lifecycle Management**: If you pass an existing `client` instance, the adapter will _never_ call `.quit()` on it when tearing down, ensuring it won't kill connections shared by the rest of your app.

## Documentation

For full configuration options and caching logic, see the [Core Documentation](https://github.com/CODE-Y02/express-route-cache/tree/main/packages/core).

## License

MIT
