---
title: "AI & MCP Support | @express-route-cache"
description: "Add @express-route-cache docs to Claude Desktop, Cursor, VS Code Copilot, Windsurf, and Perplexity. Structured manifests for hallucination-free help."
head:
  - - link
    - rel: canonical
      href: https://express-route-cache.js.org/guide/ai-support
  - - meta
    - property: og:title
      content: "AI & MCP Support | @express-route-cache"
  - - meta
    - property: og:description
      content: "Connect @express-route-cache docs to Cursor, VS Code Copilot, Windsurf, Perplexity, and Claude Desktop using native MCP."
  - - meta
    - property: og:url
      content: https://express-route-cache.js.org/guide/ai-support
---

# AI & MCP Support

`@express-route-cache` provides structured AI manifests so your coding assistant gives accurate, hallucination-free answers about the library.

## Quick Comparison

| Method | Setup | Best for... |
| :--- | :--- | :--- |
| **Perplexity** | ❌ None | Quick one-off questions |
| **Cursor @Docs** | ✅ Paste URL | Continuous indexing while coding |
| **Native MCP** | ✅ Config file | Deep research in Claude/Windsurf/VS Code |

---

## ✦ Perplexity (Zero Setup)

Perplexity browses our documentation in real-time. No installation needed.

[**Ask Perplexity →**](https://www.perplexity.ai/?q=Using+the+full+documentation+at+https://express-route-cache.js.org/llms-full.txt+answer+my+question+about+%40express-route-cache%2Fcore.)

---

## 🛠️ Cursor — @Docs

1. `Cmd + Shift + J` → **Cursor Settings** → **General** → **Documentation**
2. Click **+ Add new doc**
3. Paste: `https://express-route-cache.js.org/llms-full.txt`
4. Name it `@express-route-cache`

Now type `@express-route-cache` in Cursor Chat to get library-aware answers.

---

## 🤖 Native MCP (Claude, VS Code, Windsurf, Cursor)

We provide a dedicated MCP server that gives your AI live access to our documentation, API reference, and common patterns.

### Configuration

Add the following JSON block to the config file for your tool. No extra installation is needed if you have Node.js.

```json
{
  "mcpServers": {
    "express-route-cache": {
      "command": "npx",
      "args": [
        "-y",
        "@express-route-cache/mcp"
      ]
    }
  }
}
```

**Config file locations:**

| Tool | File path |
| :--- | :--- |
| **Claude Desktop** (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop** (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Cursor** (global) | `~/.cursor/mcp.json` |
| **VS Code + Copilot** | `.vscode/mcp.json` — use `"servers"` instead of `"mcpServers"` |
| **Windsurf** (macOS) | `~/.codeium/windsurf/mcp_config.json` |

### Capabilities

Once connected, your AI assistant gains these "Tools":
- `get-docs`: Fetches the entire library documentation for context.
- `get-page`: Fetches specific deep-dive pages (e.g., `guide/concepts-swr`).

---

## 📄 Technical Manifests

Consume these directly in your own AI pipelines:

| File | URL | Purpose |
| :--- | :--- | :--- |
| `llms.txt` | [/llms.txt](https://express-route-cache.js.org/llms.txt) | Quick context primer |
| `llms-full.txt` | [/llms-full.txt](https://express-route-cache.js.org/llms-full.txt) | Full API docs + examples |
| `ai.json` | [/ai.json](https://express-route-cache.js.org/ai.json) | Machine-readable manifest |
