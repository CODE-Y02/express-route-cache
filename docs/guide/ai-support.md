# AI & MCP Support

`@express-route-cache` is designed to be AI-first. We provide structured manifests so your AI coding assistants can provide accurate, hallucination-free help.

## 🤖 Connect to Claude Desktop (MCP)

You can add our documentation as a native resource in Claude Desktop. This allows Claude to browse our API and guides locally.

### Setup Instructions

1. Open your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following entry to the `mcpServers` section:

```json
{
  "mcpServers": {
    "express-route-cache": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-documentation",
        "https://code-y02.github.io/express-route-cache/ai.json"
      ]
    }
  }
}
```

3. Restart Claude Desktop. You will now see `@express-route-cache` as a connected tool.

---

## 🛠️ Add to Cursor (@Docs)

To get the best experience in Cursor:

1. Press `Cmd + Shift + J` (or `Ctrl + Shift + J`) to open the **Cursor Settings**.
2. Go to **General** -> **Documentation**.
3. Click **+ Add new doc**.
4. Paste the following URL:
   `https://code-y02.github.io/express-route-cache/llms-full.txt`
5. Name it `@express-route-cache`.

Now you can use `@express-route-cache` in your Chat or Composer to ask specific questions about the library.

---

## 📄 Technical Manifests

If you are building your own AI tools, you can consume our structured manifests directly:

- **Machine Context (JSON)**: [/ai.json](/ai.json)
- **Full Technical Spec (TXT)**: [/llms-full.txt](/llms-full.txt)
- **Standard llms.txt**: [/llms.txt](/llms.txt)
