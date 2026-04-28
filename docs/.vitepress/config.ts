import { defineConfig } from "vitepress";
import type { OgPageInfo } from "./og-image.js";

const base = "/";
const siteUrl = "https://express-route-cache.js.org";

// Collected during transformHead, consumed in buildEnd
const ogPages: OgPageInfo[] = [];

function getOgSlug(page: string): string {
  return page.replace(/\.md$/, "").replace(/^index$/, "home");
}

export default defineConfig({
  title: "@express-route-cache",
  description:
    "Production-grade Express.js route caching with O(1) invalidation, Stale-While-Revalidate (SWR), and Stampede Protection. Supports Redis, Memcached, and in-memory adapters.",
  base: base,
  cleanUrls: true,

  head: [
    ["link", { rel: "icon", href: `${base}logo.svg` }],
    ["link", { rel: "canonical", href: siteUrl + "/" }],
    ["meta", { name: "theme-color", content: "#646cff" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "express cache middleware, express route cache, nodejs caching, redis cache express, stale-while-revalidate express, swr nodejs, express performance, cache invalidation, stampede protection, thundering herd, express redis middleware, memcached express, nodejs api caching, express middleware typescript, o1 cache invalidation, express cache library, api response caching nodejs",
      },
    ],
    ["meta", { name: "author", content: "Yatharth Lakhate" }],
    ["meta", { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }],
    ["meta", { name: "googlebot", content: "index, follow" }],

    // Open Graph
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "express-route-cache" }],
    [
      "meta",
      {
        property: "og:title",
        content: "@express-route-cache | O(1) Route Caching for Express.js",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Production-grade Express.js route caching with O(1) invalidation, SWR, and Stampede Protection. Supports Redis, Memcached & Memory adapters.",
      },
    ],
    [
      "meta",
      {
        property: "og:url",
        content: siteUrl + "/",
      },
    ],
    // og:image and twitter:image are injected per-page via transformHead
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:image:alt", content: "express-route-cache — O(1) Route Caching for Express.js" }],

    // Twitter / X
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "@express-route-cache | O(1) Route Caching for Express.js" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Production-grade Express.js caching: O(1) invalidation, SWR, Stampede Protection. Redis, Memcached & Memory adapters.",
      },
    ],
    ["meta", { name: "twitter:site", content: "@Yatharth_L" }],
    ["meta", { name: "twitter:creator", content: "@Yatharth_L" }],

    // JSON-LD: SoftwareApplication
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "@express-route-cache",
        alternateName: "express-route-cache",
        url: siteUrl,
        description:
          "Production-grade Express.js route caching middleware with O(1) epoch invalidation, Stale-While-Revalidate (SWR), Stampede Protection, and adapters for Redis, Memcached, and in-memory storage.",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Caching Middleware",
        operatingSystem: "Node.js",
        programmingLanguage: ["TypeScript", "JavaScript"],
        runtimePlatform: "Node.js",
        license: "https://opensource.org/licenses/MIT",
        codeRepository: "https://github.com/CODE-Y02/express-route-cache",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Yatharth Lakhate",
          url: "https://github.com/CODE-Y02",
        },
        keywords: "express, cache, redis, memcached, swr, stale-while-revalidate, stampede protection, nodejs, typescript",
        featureList: [
          "O(1) cache invalidation via Epoch Versioning",
          "Stale-While-Revalidate (SWR) background refresh",
          "Stampede Protection via Request Coalescing",
          "Redis adapter (ioredis)",
          "Memcached adapter (memjs)",
          "In-memory adapter",
          "Binary data support (images, PDFs)",
          "Header preservation (CORS, Content-Type)",
          "TypeScript-first API",
        ],
      }),
    ],

    // JSON-LD: WebSite with SearchAction (Sitelinks Searchbox)
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "express-route-cache Documentation",
        url: siteUrl,
        description: "Official documentation for the @express-route-cache Node.js library.",
        publisher: {
          "@type": "Person",
          name: "Yatharth Lakhate",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: siteUrl + "/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }),
    ],

    // JSON-LD: FAQPage for rich results
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is @express-route-cache?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "@express-route-cache is a production-grade caching middleware for Express.js. It provides O(1) route invalidation via Epoch Versioning, Stale-While-Revalidate (SWR) background refresh, and Stampede Protection. It supports Redis, Memcached, and in-memory adapters.",
            },
          },
          {
            "@type": "Question",
            name: "How does O(1) cache invalidation work in express-route-cache?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Instead of scanning Redis keys (KEYS/SCAN), express-route-cache assigns an integer epoch counter to every route pattern. When you invalidate /api/users, it increments that epoch. All future cache lookups embed the new epoch in their key, making old entries instantly obsolete — without touching a single stored key.",
            },
          },
          {
            "@type": "Question",
            name: "Does express-route-cache support Redis?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Install @express-route-cache/redis and ioredis. Then use createRedisAdapter({ url: 'redis://localhost:6379' }) as the adapter when creating your cache instance. It uses Redis MGET and INCR for O(1) performance.",
            },
          },
          {
            "@type": "Question",
            name: "What is Stale-While-Revalidate (SWR) in express-route-cache?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "SWR means the server instantly returns stale (slightly old) cached data to the client, then triggers a background refresh. This eliminates latency spikes from cache misses. Enable it with swr: true in createCache() or per-route in cache.route().",
            },
          },
          {
            "@type": "Question",
            name: "What is Stampede Protection in express-route-cache?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Stampede Protection prevents the thundering herd problem. When a cache miss occurs, the first request executes the handler and stores a pending Promise. Subsequent concurrent requests await that same Promise instead of hitting the database again, preventing N simultaneous DB queries.",
            },
          },
          {
            "@type": "Question",
            name: "Is express-route-cache free and open source?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. @express-route-cache is 100% free and released under the MIT License. The source code is available on GitHub at https://github.com/CODE-Y02/express-route-cache.",
            },
          },
        ],
      }),
    ],
  ],

  sitemap: {
    hostname: siteUrl + "/",
  },

  // Per-page OG image injection
  transformHead(ctx) {
    const slug = getOgSlug(ctx.page);
    const title = ctx.pageData.title || ctx.title || "@express-route-cache";
    const description = ctx.pageData.description || ctx.description || "";

    // Collect for buildEnd (avoid duplicates from HMR restarts)
    if (!ogPages.find((p) => p.slug === slug)) {
      ogPages.push({ slug, title, description });
    }

    const ogImageUrl = `${siteUrl}/og/${slug}.png`;
    return [
      ["meta", { property: "og:image", content: ogImageUrl }],
      ["meta", { name: "twitter:image", content: ogImageUrl }],
    ];
  },

  async buildEnd(siteConfig) {
    console.log(`\n[og-image] Generating ${ogPages.length} OG images...`);
    const { generateOgImages } = await import("./og-image.js");
    await generateOgImages(siteConfig.outDir, ogPages);
    console.log("[og-image] Done.\n");
  },

  themeConfig: {
    logo: `${base}logo.svg`,

    search: {
      provider: "local",
    },

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Adapters", link: "/guide/adapters" },
      { text: "Reference", link: "/reference/api" },
      {
        text: "🤖 Ask AI",
        items: [
          {
            text: "Ask ChatGPT",
            link: `https://chatgpt.com/?q=Analyze+the+technical+manifest+at+https://express-route-cache.js.org/ai.json+IMPORTANT:+This+is+for+@express-route-cache/core.+NEVER+suggest+npm+install+express-route-cache+without+the+scope.+Use+only+the+scoped+package+name.`,
          },
          {
            text: "Ask Claude",
            link: `https://claude.ai/new?q=Analyze+the+technical+manifest+at+https://express-route-cache.js.org/ai.json+IMPORTANT:+This+is+for+@express-route-cache/core.+Never+suggest+installing+the+unscoped+express-route-cache+package.`,
          },
        ],
      },
      {
        text: "⭐ Star on GitHub",
        link: "https://github.com/CODE-Y02/express-route-cache",
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is express-route-cache?", link: "/" },
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Example: Todo App", link: "/guide/example-todo" },
          { text: "vs. Other Libraries", link: "/guide/comparison" },
        ],
      },
      {
        text: "Core Concepts",
        items: [
          { text: "Fresh vs Stale (SWR)", link: "/guide/concepts-swr" },
          { text: "Epoch Invalidation", link: "/guide/concepts-invalidation" },
          { text: "Stampede Protection", link: "/guide/concepts-stampede" },
        ],
      },
      {
        text: "Adapters",
        collapsed: false,
        items: [
          { text: "Overview", link: "/guide/adapters" },
          { text: "Memory", link: "/guide/adapter-memory" },
          { text: "Redis", link: "/guide/adapter-redis" },
          { text: "Memcached", link: "/guide/adapter-memcached" },
        ],
      },
      {
        text: "Advanced",
        items: [
          { text: "Binary Support", link: "/guide/binary-support" },
          { text: "Header Preservation", link: "/guide/headers" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
          { text: "🤖 AI & MCP Support", link: "/guide/ai-support" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/reference/api" },
          { text: "Architecture", link: "/reference/architecture" },
          { text: "FAQ", link: "/guide/faq" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/CODE-Y02/express-route-cache",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Yatharth Lakhate",
    },
  },
});
