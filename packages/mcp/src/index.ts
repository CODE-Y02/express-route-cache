#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DOCS_BASE = "https://express-route-cache.js.org";

const server = new McpServer({
  name: "@express-route-cache/mcp",
  version: "1.1.0",
});

// ─── Resources ─────────────────────────────────────────────────────────────

// Discovery Manifest (JSON index)
server.registerResource(
  "manifest",
  `${DOCS_BASE}/ai.json`,
  {
    description:
      "Machine-readable index of capabilities, API signatures, common mistakes, and documentation slugs.",
  },
  async (uri) => {
    try {
      const res = await fetch(uri.href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.text();
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: json }],
      };
    } catch (e) {
      // Fallback to llms.txt if ai.json is missing
      const fallbackUrl = `${DOCS_BASE}/llms.txt`;
      const res = await fetch(fallbackUrl);
      if (!res.ok)
        throw new Error(`Manifest and Fallback failed: ${res.status}`);
      const text = await res.text();
      return { contents: [{ uri: fallbackUrl, mimeType: "text/plain", text }] };
    }
  },
);

// Full documentation (primary resource)
server.registerResource(
  "docs-full",
  `${DOCS_BASE}/llms-full.txt`,
  {
    description:
      "Full @express-route-cache API documentation, usage patterns, and hallucination guard.",
  },
  async (uri) => {
    try {
      const res = await fetch(uri.href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text }] };
    } catch (e) {
      const fallbackUrl = `${DOCS_BASE}/llms.txt`;
      const res = await fetch(fallbackUrl);
      if (!res.ok)
        throw new Error(`Full Docs and Fallback failed: ${res.status}`);
      const text = await res.text();
      return { contents: [{ uri: fallbackUrl, mimeType: "text/plain", text }] };
    }
  },
);

// Quick context (llms.txt)
server.registerResource(
  "docs-quick",
  `${DOCS_BASE}/llms.txt`,
  {
    description:
      "Quick context primer for @express-route-cache with essential identity and hallucination guard.",
  },
  async (uri) => {
    try {
      const res = await fetch(uri.href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return { contents: [{ uri: uri.href, mimeType: "text/plain", text }] };
    } catch (e) {
      throw new Error(`Failed to fetch quick docs: ${e}`);
    }
  },
);

// ─── Tools ──────────────────────────────────────────────────────────────────

/**
 * get-docs — fetch the full documentation on demand.
 */
server.registerTool(
  "get-docs",
  {
    description:
      "Fetch the full @express-route-cache documentation including API reference, usage patterns, adapter setup, and common mistakes to avoid. Use this for comprehensive context.",
    inputSchema: z.object({}),
  },
  async () => {
    const res = await fetch(`${DOCS_BASE}/llms-full.txt`);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch documentation (HTTP ${res.status}). Visit ${DOCS_BASE} directly.`,
          },
        ],
        isError: true,
      };
    }
    const text = await res.text();
    return {
      content: [
        {
          type: "text",
          text: `# @express-route-cache Documentation\nSource: ${DOCS_BASE}/llms-full.txt\n\n${text}`,
        },
      ],
    };
  },
);

/**
 * get-quick-docs — fetch quick context primer.
 */
server.registerTool(
  "get-quick-docs",
  {
    description:
      "Fetch a quick context primer with essential package identity, core features, and hallucination guard. Use this for fast context without full documentation.",
    inputSchema: z.object({}),
  },
  async () => {
    const res = await fetch(`${DOCS_BASE}/llms.txt`);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch quick docs (HTTP ${res.status}). Visit ${DOCS_BASE} directly.`,
          },
        ],
        isError: true,
      };
    }
    const text = await res.text();
    return {
      content: [
        {
          type: "text",
          text: `# @express-route-cache Quick Context\nSource: ${DOCS_BASE}/llms.txt\n\n${text}`,
        },
      ],
    };
  },
);

/**
 * get-page — fetch a specific documentation page by slug.
 */
server.registerTool(
  "get-page",
  {
    description:
      "Fetch a specific @express-route-cache documentation page. Use this for deep dives into specific topics. Common slugs: 'guide/getting-started', 'guide/recipes', 'reference/api', 'guide/concepts-swr', 'guide/concepts-invalidation'.",
    inputSchema: z.object({
      slug: z
        .string()
        .describe("Page slug, e.g. 'guide/getting-started' or 'reference/api'"),
    }),
  },
  async ({ slug }) => {
    const url = `${DOCS_BASE}/${slug}`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Page not found: ${url}. Check the 'manifest' resource for available slugs.`,
          },
        ],
        isError: true,
      };
    }
    const html = await res.text();
    // Strip HTML tags for cleaner text output
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return {
      content: [{ type: "text", text: `# ${slug}\nSource: ${url}\n\n${text}` }],
    };
  },
);

/**
 * get-api — fetch API reference.
 */
server.registerTool(
  "get-api",
  {
    description:
      "Fetch the complete API reference for createCache, route options, cache methods, and the CacheClient interface. Use this for detailed API documentation.",
    inputSchema: z.object({}),
  },
  async () => {
    const url = `${DOCS_BASE}/reference/api`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch API reference (HTTP ${res.status}). Visit ${url} directly.`,
          },
        ],
        isError: true,
      };
    }
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return {
      content: [
        { type: "text", text: `# API Reference\nSource: ${url}\n\n${text}` },
      ],
    };
  },
);

/**
 * get-guide — fetch a specific guide page.
 */
server.registerTool(
  "get-guide",
  {
    description:
      "Fetch a specific guide page. Available guides: 'getting-started', 'adapters', 'adapter-memory', 'adapter-redis', 'adapter-memcached', 'concepts-swr', 'concepts-invalidation', 'concepts-stampede', 'recipes', 'cache-fetch', 'testing', 'deployment', 'example-todo', 'studio', 'troubleshooting', 'faq', 'comparison', 'ai-support'.",
    inputSchema: z.object({
      guide: z
        .string()
        .describe("Guide name, e.g. 'getting-started' or 'recipes'"),
    }),
  },
  async ({ guide }) => {
    const url = `${DOCS_BASE}/guide/${guide}`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Guide not found: ${url}. Available guides: getting-started, adapters, adapter-memory, adapter-redis, adapter-memcached, concepts-swr, concepts-invalidation, concepts-stampede, recipes, cache-fetch, testing, deployment, example-todo, studio, troubleshooting, faq, comparison, ai-support.`,
          },
        ],
        isError: true,
      };
    }
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return {
      content: [
        { type: "text", text: `# Guide: ${guide}\nSource: ${url}\n\n${text}` },
      ],
    };
  },
);

/**
 * get-architecture — fetch architecture and design documentation.
 */
server.registerTool(
  "get-architecture",
  {
    description:
      "Fetch the architecture and design documentation explaining O(1) epoch invalidation, two-tier stampede protection, SWR implementation, header preservation, and binary support. Use this for understanding internal design decisions.",
    inputSchema: z.object({}),
  },
  async () => {
    const url = `${DOCS_BASE}/reference/architecture`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch architecture docs (HTTP ${res.status}). Visit ${url} directly.`,
          },
        ],
        isError: true,
      };
    }
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return {
      content: [
        {
          type: "text",
          text: `# Architecture & Design\nSource: ${url}\n\n${text}`,
        },
      ],
    };
  },
);

/**
 * get-adapter-docs — fetch adapter-specific documentation.
 */
server.registerTool(
  "get-adapter-docs",
  {
    description:
      "Fetch documentation for a specific adapter. Use this for setup instructions and configuration details for Memory, Redis, or Memcached adapters.",
    inputSchema: z.object({
      adapter: z
        .enum(["memory", "redis", "memcached"])
        .describe("Adapter type: 'memory', 'redis', or 'memcached'"),
    }),
  },
  async ({ adapter }) => {
    const url = `${DOCS_BASE}/guide/adapter-${adapter}`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Adapter documentation not found: ${url}. Available adapters: memory, redis, memcached.`,
          },
        ],
        isError: true,
      };
    }
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return {
      content: [
        {
          type: "text",
          text: `# ${adapter.charAt(0).toUpperCase() + adapter.slice(1)} Adapter\nSource: ${url}\n\n${text}`,
        },
      ],
    };
  },
);

/**
 * search-docs — search for specific topics across documentation.
 */
server.registerTool(
  "search-docs",
  {
    description:
      "Search the full documentation for specific topics like 'invalidation', 'swr', 'stampede', 'binary', 'headers', 'redis', 'memcached', 'testing', 'deployment'. Returns relevant sections from the documentation.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Search query, e.g. 'invalidation', 'swr', 'redis setup'"),
    }),
  },
  async ({ query }) => {
    const res = await fetch(`${DOCS_BASE}/llms-full.txt`);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch documentation for search (HTTP ${res.status}).`,
          },
        ],
        isError: true,
      };
    }
    const text = await res.text();
    const lines = text.split("\n");
    const queryLower = query.toLowerCase();

    // Find relevant sections
    const relevantLines: string[] = [];
    let inRelevantSection = false;

    for (const line of lines) {
      if (
        line.toLowerCase().includes(queryLower) ||
        line.toLowerCase().includes(query.replace(/\s+/g, "-"))
      ) {
        inRelevantSection = true;
      }

      if (inRelevantSection) {
        relevantLines.push(line);
        // Stop after collecting enough context
        if (relevantLines.length > 50) break;
      }

      // Reset if we hit a major section break
      if (line.startsWith("---") && relevantLines.length > 5) {
        break;
      }
    }

    const result =
      relevantLines.length > 0
        ? relevantLines.join("\n")
        : `No direct matches found for "${query}". Try broader terms or use get-docs for full documentation.`;

    return {
      content: [
        { type: "text", text: `# Search Results: "${query}"\n\n${result}` },
      ],
    };
  },
);

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
