import { defineConfig } from "vitepress";

// Detect if we are running in GitHub Actions and set the base path accordingly
const rawBase = process.env.VITEPRESS_BASE || "/express-route-cache/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  title: "@express-route-cache",
  description: "⚡ TanStack Query for the Backend",
  base: base,

  head: [
    ["link", { rel: "icon", href: `${base}logo.svg` }],
    ["meta", { name: "keywords", content: "express, cache, redis, memcached, swr, stale-while-revalidate, performance, nodejs, typescript" }],
    ["meta", { name: "author", content: "Yatharth Lakhate" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "@express-route-cache | TanStack Query for the Backend" }],
    ["meta", { property: "og:description", content: "Production-grade, drop-in route caching for Express.js with O(1) invalidation, SWR, and Stampede Protection." }],
  ],

  themeConfig: {
    logo: `${base}logo.svg`,

    search: {
      provider: "local",
    },

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Adapters", link: "/guide/adapters" },
      { text: "Reference", link: "/reference/api" },
      { text: "⭐ Star on GitHub", link: "https://github.com/CODE-Y02/express-route-cache" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is express-route-cache?", link: "/" },
          { text: "Getting Started", link: "/guide/getting-started" },
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
        items: [
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
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/reference/api" },
          { text: "Architecture", link: "/reference/architecture" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/CODE-Y02/express-route-cache" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Yatharth Lakhate",
    },
  },
});
