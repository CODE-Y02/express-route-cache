import { defineConfig } from "vitepress";

// Detect if we are running in GitHub Actions and set the base path accordingly
const rawBase = process.env.VITEPRESS_BASE || "/express-route-cache/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  title: "@express-route-cache",
  description: "⚡ TanStack Query for the Backend",
  base: base,
  cleanUrls: true,
  appearance: "dark",

  head: [
    ["link", { rel: "icon", href: `${base}logo.svg` }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "express, cache, redis, memcached, swr, stale-while-revalidate, performance, nodejs, typescript, tanstack query, request coalescing, stampede protection",
      },
    ],
    ["meta", { name: "author", content: "Yatharth Lakhate" }],
    ["meta", { name: "robots", content: "index, follow" }],

    // Theme initialization script to prevent FOUC
    [
      "script",
      {},
      `
      (function() {
        try {
          var theme = localStorage.getItem('erc-theme') || 'ember';
          if (theme === 'enver') theme = 'ember';
          if (theme === 'space') theme = 'night';
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
      `
    ],

    // Open Graph
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      {
        property: "og:title",
        content: "@express-route-cache | TanStack Query for the Backend",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Production-grade, drop-in route caching for Express.js with O(1) invalidation, SWR, and Stampede Protection.",
      },
    ],
    [
      "meta",
      {
        property: "og:url",
        content: "https://code-y02.github.io/express-route-cache/",
      },
    ],
    ["meta", { property: "og:image", content: `${base}og-image.png` }],

    // Twitter
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "@express-route-cache" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "TanStack Query for the Backend. O(1) invalidation and SWR for Express.",
      },
    ],
    ["meta", { name: "twitter:site", content: "@Yatharth_L" }],

    // JSON-LD Structured Data for Google
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "@express-route-cache",
        description:
          "Production-grade, drop-in route caching for Express.js with O(1) invalidation and SWR.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Node.js",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Yatharth Lakhate",
        },
      }),
    ],
  ],

  sitemap: {
    hostname: "https://code-y02.github.io/express-route-cache/",
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

      // {
      //   text: "🤖 Ask AI",
      //   items: [
      //     {
      //       text: "Ask ChatGPT",
      //       link: `https://chatgpt.com/?q=Analyze+the+technical+manifest+at+https://code-y02.github.io/express-route-cache/ai.json+IMPORTANT:+This+is+for+@express-route-cache/core.+NEVER+suggest+npm+install+express-route-cache+without+the+scope.+Use+only+the+scoped+package+name.`,
      //     },
      //     {
      //       text: "Ask Claude",
      //       link: `https://claude.ai/new?q=Analyze+the+technical+manifest+at+https://code-y02.github.io/express-route-cache/ai.json+IMPORTANT:+This+is+for+@express-route-cache/core.+Never+suggest+installing+the+unscoped+express-route-cache+package.`,
      //     },
      //     {
      //       text: "Machine Context (JSON)",
      //       link: "/express-route-cache/ai.json",
      //     },
      //   ],
      // },
    ],

    sidebar: {
      "/v1/": [
        {
          text: "Introduction",
          items: [
            { text: "What is express-route-cache?", link: "/v1/" },
            { text: "Getting Started", link: "/v1/guide/getting-started" },
            { text: "Example: Todo App", link: "/v1/guide/example-todo" },
            { text: "vs. Other Libraries", link: "/v1/guide/comparison" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Fresh vs Stale (SWR)", link: "/v1/guide/concepts-swr" },
            { text: "Epoch Invalidation", link: "/v1/guide/concepts-invalidation" },
            { text: "Stampede Protection", link: "/v1/guide/concepts-stampede" },
          ],
        },
        {
          text: "Adapters",
          collapsed: false,
          items: [
            { text: "Overview", link: "/v1/guide/adapters" },
            { text: "Memory", link: "/v1/guide/adapter-memory" },
            { text: "Redis", link: "/v1/guide/adapter-redis" },
            { text: "Memcached", link: "/v1/guide/adapter-memcached" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Binary Support", link: "/v1/guide/binary-support" },
            { text: "Header Preservation", link: "/v1/guide/headers" },
            { text: "Troubleshooting", link: "/v1/guide/troubleshooting" },
            { text: "🤖 AI & MCP Support", link: "/v1/guide/ai-support" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "API Reference", link: "/v1/reference/api" },
            { text: "Architecture", link: "/v1/reference/architecture" },
            { text: "FAQ", link: "/v1/guide/faq" },
          ],
        },
      ],
      "/": [
      {
        text: "Introduction",
        items: [
          { text: "Why express-route-cache?", link: "/guide/why" },
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Cache Studio", link: "/guide/studio" },
          { text: "Example: Todo API", link: "/guide/example-todo" },
        ],
      },
      {
        text: "Core Concepts",
        items: [
          { text: "Fresh vs Stale (SWR)", link: "/guide/concepts-swr" },
          { text: "Epoch Invalidation", link: "/guide/concepts-invalidation" },
          { text: "Stampede Protection", link: "/guide/concepts-stampede" },
          { text: "Standalone Fetch", link: "/guide/cache-fetch" },
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
        text: "Guides",
        items: [
          { text: "Recipes", link: "/guide/recipes" },
          { text: "Testing", link: "/guide/testing" },
          { text: "Deployment", link: "/guide/deployment" },
          { text: "Binary Support", link: "/guide/binary-support" },
          { text: "Header Preservation", link: "/guide/headers" },
          { text: "🤖 AI & MCP Support", link: "/guide/ai-support" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/reference/api" },
          { text: "Architecture", link: "/reference/architecture" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
        ],
      },
      ],
    },

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
