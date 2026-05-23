---
"@express-route-cache/core": minor
"@express-route-cache/redis": minor
"@express-route-cache/memcached": minor
"@express-route-cache/studio": minor
---

### Documentation Site Modernization
- **Multi-Theme Engine**: Implemented a custom 4-theme architecture (`Ember`, `Thunder`, `Sea`, `Night`) featuring persistent state management, a custom emoji-based Vue switcher, and Flash-of-Unstyled-Content (FOUC) prevention.
- **Accessibility (WCAG AA) Overhaul**: Decoupled button gradients from text link colors to ensure maximum contrast in Light Mode, while maintaining high-saturation neon aesthetics in Dark Mode. Removed unnecessary strokes/borders from code blocks for cleaner reading.
- **New Technical Guides**: Authored and published five massive new guides: `Why express-route-cache?`, `Testing`, `Deployment`, `Recipes & Patterns`, and `Standalone Fetch`.
- **API Reference Fixes**: Resolved 404 dead links in the API documentation that were blocking the build pipeline.

### Package SEO & Registry Optimization
- **NPM Homepage Links**: Repointed the `"homepage"` field in all `package.json` files (`core`, `redis`, `memcached`) directly to the Vitepress documentation site to improve NPM-to-Docs traffic funnels.
- **README Synchronization**: Audited and completely updated the README files for the `core`, `adapter-redis`, and `adapter-memcached` packages. 
  - Added the newly introduced `metrics` and `studio` options to the core API table.
  - Modernized the adapter instantiation examples to use the safer, explicit `{ client: redisClient }` pattern instead of passing connection strings.

### AI Integration Context
- **MCP & LLM Sync**: Updated `ai.json`, `llms.txt`, and `llms-full.txt` to include all the new guide URLs and fixed an outdated `staleTime` type error to ensure AI models generate accurate code snippets.
- **MCP Server Fix**: Patched the compiled `mcp` server package to query the correct GitHub Pages domain instead of a dead `.js.org` placeholder.
