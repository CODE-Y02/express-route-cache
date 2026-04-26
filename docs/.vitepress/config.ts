import { defineConfig } from "vitepress";

// Detect if we are running in GitHub Actions and set the base path accordingly
const rawBase = process.env.VITEPRESS_BASE || "/express-route-cache/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  title: "@express-route-cache",
  description: "⚡ TanStack Query for the Backend",
  base: base,
  cleanUrls: true,

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
      {
        text: "🤖 Ask AI",
        items: [
          {
            text: "Ask ChatGPT",
            link: `https://chatgpt.com/?q=Analyze+the+technical+documentation+at+https://code-y02.github.io/express-route-cache/llms-full.txt+IMPORTANT:+This+is+for+@express-route-cache/core.+NEVER+suggest+npm+install+express-route-cache+without+the+scope.+Use+only+the+scoped+package+name.`,
          },
          {
            text: "Ask Claude",
            link: `https://claude.ai/new?q=Analyze+the+technical+documentation+at+https://code-y02.github.io/express-route-cache/llms-full.txt+IMPORTANT:+This+is+for+@express-route-cache/core.+Never+suggest+installing+the+unscoped+express-route-cache+package.`,
          },
          {
            text: "Context Manifests",
            items: [
              { text: "Full Technical Spec (TXT)", link: "/llms-full.txt" },
              { text: "Machine Context (JSON)", link: "/ai.json" },
              { text: "Add to Cursor (@Docs)", link: "/guide/ai-support#add-to-cursor-docs" },
              { text: "Connect to Claude (MCP)", link: "/guide/ai-support#connect-to-claude-desktop-mcp" },
            ]
          }
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
