# @express-route-cache/mcp

> MCP server for @express-route-cache — gives Claude, Cursor, VS Code, and Windsurf live access to the documentation.

## Installation

```bash
npm install @express-route-cache/mcp
```

## Usage

This package provides a Model Context Protocol (MCP) server that enables AI coding assistants to access the @express-route-cache documentation directly.

### Configuration

Add the following JSON block to the config file for your AI tool:

```json
{
  "mcpServers": {
    "express-route-cache": {
      "command": "npx",
      "args": ["-y", "@express-route-cache/mcp"]
    }
  }
}
```

**Config file locations:**

| Tool                         | File path                                                         |
| :--------------------------- | :---------------------------------------------------------------- |
| **Claude Desktop** (macOS)   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop** (Windows) | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| **Cursor** (global)          | `~/.cursor/mcp.json`                                              |
| **VS Code + Copilot**        | `.vscode/mcp.json` — use `"servers"` instead of `"mcpServers"`    |
| **Windsurf** (macOS)         | `~/.codeium/windsurf/mcp_config.json`                             |

### Capabilities

Once connected, your AI assistant gains these "Tools":

- `get-docs`: Fetches the entire library documentation for comprehensive context.
- `get-quick-docs`: Fetches a quick context primer with essential package identity and hallucination guard.
- `get-page`: Fetches specific deep-dive pages by slug (e.g., `guide/concepts-swr`).
- `get-api`: Fetches the complete API reference for createCache, route options, and cache methods.
- `get-guide`: Fetches specific guide pages (getting-started, recipes, testing, deployment, etc.).
- `get-architecture`: Fetches architecture and design documentation explaining O(1) invalidation, stampede protection, SWR, etc.
- `get-adapter-docs`: Fetches adapter-specific documentation for Memory, Redis, or Memcached.
- `search-docs`: Searches the full documentation for specific topics like 'invalidation', 'swr', 'redis setup'.

### Resources

The MCP server also provides these resources:

- `manifest`: Machine-readable index of capabilities, API signatures, and documentation slugs.
- `docs-full`: Full @express-route-cache API documentation and usage patterns.
- `docs-quick`: Quick context primer with essential package identity and hallucination guard.

## Documentation

For more information about AI integration and MCP setup, visit our [AI Support Guide](https://express-route-cache.js.org/guide/ai-support).

## License

MIT
