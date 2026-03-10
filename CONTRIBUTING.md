# Contributing to @express-route-cache

First off, thank you for considering contributing to `@express-route-cache`! It's people like you that make this tool great.

## Development Setup

1. **Fork** and **clone** the repository.
2. Ensure you have **pnpm** installed (`npm i -g pnpm`).
3. Run `pnpm install` at the root of the project to install all dependencies.
4. Run `pnpm build` to compile the TypeScript packages.
5. Run `pnpm test` to execute the integration test suite.

## Repository Structure

We use a monorepo structure managed by `pnpm` workspaces and `turbo` for task running.

- `packages/core`: The core caching logic, interfaces, utilities, and the Memory adapter.
- `packages/adapter-redis`: The official Redis adapter (using `ioredis`).
- `packages/adapter-memcached`: The official Memcached adapter (using `memjs`).
- `examples/node-cache`: An example Express application utilizing the core package.

## Submitting Pull Requests

1. **Branch Format:** Create a new branch for your feature or bug fix: `git checkout -b feature/my-new-feature` or `git checkout -b fix/issue-123-description`.
2. **Write Tests:** Ensure that any new functionality is covered by tests in `packages/core/tests/cache.test.ts` (or appropriate adapter tests).
3. **Format Code:** Ensure your code is properly formatted and passes TypeScript compilation (`pnpm build`).
4. **Changeset:** Run `npx changeset` to create a changeset documenting your changes. This is required for our automated release process. Commit the generated markdown file along with your code.
5. **Open PR:** Submit a Pull Request against the `main` branch. Provide a clear description of the problem solved or feature added.

## Release Channels & Versioning

We use an automated CI/CD pipeline driven by GitHub Actions and the `changesets` package. Depending on the branch you push to, the deployment behaves differently to match NPM `dist-tags`.

### 1. `main` Branch (Stable releases)
- This is the bleeding edge for stable, production-ready code.
- A push to `main` with a valid changeset file triggers the **Release Bot** to open a pull request.
- **Merge the PR** to automatically publish to the `@latest` tag on NPM.

### 2. `next` Branch (Beta / Release Candidates)
- Use this branch for massive rewrites or features that need community testing before hitting `main`.
- To start a beta track, run `pnpm changeset pre enter next` locally, commit the generated config, and push.
- The Release Bot will append a beta tag (e.g. `1.1.0-beta.0`) and publish cleanly to the `@next` tag on NPM.

### 3. `v*` Branches (Legacy Hotfixes)
- If you need to patch an older version (e.g. `v0.1`), create a dedicated branch named `v0.1`.
- A push to `v0.1` will trigger the Release Bot locally *for that branch*.
- **WARNING:** Do not merge the bot's PR for `v*` branches! If the bot auto-publishes an old version, NPM's default behavior is to tag it as `@latest`, overwriting your current modern version in the registry. 
- **Legacy branches must currently be manually published:**
  ```bash
  git checkout v0.1
  # ... make your fixes, build, run `pnpm changeset version`
  pnpm changeset publish --tag v0.1-lts
  ```

## Reporting Bugs

Please use the GitHub Issue tracker. Ensure you provide:

- The version of `@express-route-cache` packages you are using.
- Your Node.js version.
- A minimal reproducible example (code snippet or a small repository).
- Clear steps to reproduce the issue.

Thank you!
