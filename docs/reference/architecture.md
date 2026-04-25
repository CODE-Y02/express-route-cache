# Architecture & Design

This page explains the core architectural choices and trade-offs made in `@express-route-cache`.

## 1. O(1) Epoch Invalidation

Traditional cache middlewares map a URL directly to a cache key. To invalidate a group of keys (e.g., all posts), they often use slow `SCAN` or `KEYS` commands in Redis.

**Our Solution:** We assign an integer "epoch" counter to every route pattern. This epoch is embedded into the cache key. To invalidate, we simply increment the counter. All future requests generate new keys, making old ones instantly obsolete.

## 2. Stampede Protection

When a popular cache entry expires, hundreds of concurrent requests might hit your database at once (the "thundering herd").

**Our Solution:** We use **Request Coalescing**. The first request for an expired key holds a pending Promise. All subsequent requests for that same key await that same Promise instead of hitting the database again.

## 3. Stale-While-Revalidate (SWR)

Latency spikes occur when a user hits an expired cache and has to wait for a database refresh.

**Our Solution:** If `swr` is enabled and data is within its `gcTime`, we serve the stale data to the user immediately and close the connection. Then, in the background, we trigger a revalidation to update the cache for the next user.

## 4. Header Preservation

Most libraries only cache the JSON body and lose critical headers like CORS, Content-Type, or custom app metadata.

**Our Solution:** We capture the full response state using `res.getHeaders()`. When serving a cache HIT, we perfectly replay the original response, ensuring high-fidelity delivery.

## 5. Binary Support

Standard caching libraries often corrupt binary data (images, PDFs) by treating them as UTF-8 strings.

**Our Solution:** We use a Base64 serialization layer. Non-string bodies are encoded to Base64 for storage and decoded back to Buffers upon retrieval, supporting any binary response out of the box.
