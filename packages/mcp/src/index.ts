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
    description: "Machine-readable index of capabilities, API signatures, common mistakes, and documentation slugs.",
  },
  async (uri) => {
    try {
      const res = await fetch(uri.href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.text();
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: json }] };
    } catch (e) {
      // Fallback to llms.txt if ai.json is missing
      const fallbackUrl = `${DOCS_BASE}/llms.txt`;
      const res = await fetch(fallbackUrl);
      if (!res.ok) throw new Error(`Manifest and Fallback failed: ${res.status}`);
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
    description: "Full @express-route-cache API documentation, usage patterns, and hallucination guard.",
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
      if (!res.ok) throw new Error(`Full Docs and Fallback failed: ${res.status}`);
      const text = await res.text();
      return { contents: [{ uri: fallbackUrl, mimeType: "text/plain", text }] };
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
    description: "Fetch the full @express-route-cache documentation including API reference, usage patterns, adapter setup, and common mistakes to avoid.",
    inputSchema: z.object({}),
  },
  async () => {
    const res = await fetch(`${DOCS_BASE}/llms-full.txt`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Failed to fetch documentation (HTTP ${res.status}). Visit ${DOCS_BASE} directly.` }],
        isError: true,
      };
    }
    const text = await res.text();
    return {
      content: [{ type: "text", text: `# @express-route-cache Documentation\nSource: ${DOCS_BASE}/llms-full.txt\n\n${text}` }],
    };
  }
);

/**
 * get-page — fetch a specific documentation page by slug.
 */
server.registerTool(
  "get-page",
  {
    description: "Fetch a specific @express-route-cache documentation page. Slugs can be found in the 'manifest' resource.",
    inputSchema: z.object({
      slug: z.string().describe("Page slug, e.g. 'guide/getting-started' or 'reference/api'"),
    }),
  },
  async ({ slug }) => {
    const url = `${DOCS_BASE}/${slug}`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Page not found: ${url}. Check the 'manifest' resource for available slugs.` }],
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
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
