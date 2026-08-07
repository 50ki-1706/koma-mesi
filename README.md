# next-starter

[日本語](./README.ja.md)

[![Built with Devbox](https://www.jetify.com/img/devbox/shield_galaxy.svg)](https://www.jetify.com/devbox/docs/contributor-quickstart/)

A starter template for building full-stack applications with Next.js. It includes the tools and configuration needed for the development environment, authentication, database, testing, and more.

## Key Features

### Runtime and Development Environment

- [Node.js 26.4.0](https://nodejs.org/) — JavaScript runtime
- [pnpm 11.1.2](https://pnpm.io/) — Fast, efficient package manager
- [cocogitto 7.0.0](https://docs.cocogitto.io/) — Git hook tool for validating commit messages
- [Devbox](https://www.jetify.com/devbox/) — Toolchain manager for reproducible development environments
- [Dev Containers](https://containers.dev/) — A way to use containerized development environments in VS Code
- [SQLite](https://www.sqlite.org/index.html) — Lightweight embedded SQL database

### Frameworks and Libraries

- [Next.js 16.3](https://nextjs.org/) — React framework for building full-stack applications
- [Better Auth](https://better-auth.com) — Authentication library for TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [oRPC](https://orpc.dev) — Type-safe RPC framework with OpenAPI support
- [Zod](https://zod.dev/) — TypeScript-first schema validation library
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM for SQL databases

### Development and Quality Tools

- [TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — Native TypeScript compiler and type checker
- [Biome](https://biomejs.dev/) — Fast code formatter and linter
- [Vitest](https://vitest.dev/) — Vite-based unit testing framework
- [Storybook](https://storybook.js.org/) — Tool for developing UI components in isolation

## Setup

See the setup guide for your operating system:

| OS | Guide |
|---|---|
| macOS | [docs/setup/mac/README.md](./docs/setup/mac/README.md) |
| Linux | [docs/setup/linux/README.md](./docs/setup/linux/README.md) |
| Windows (WSL2) | [docs/setup/windows/README.md](./docs/setup/windows/README.md) |

### Prerequisites

- [Git](https://git-scm.com/)
- [Devbox](https://www.jetify.com/devbox/docs/installing-devbox/)

> [!NOTE]
> The Devbox CLI does not run directly on Windows. Use WSL2 or a Dev Container instead.

## TypeScript 7

This template uses the native TypeScript 7 compiler. Next.js 16.3 runs the project-local `tsc` CLI during production builds by default, so no additional configuration is required.

Run type checking independently with the following command.

```bash
pnpm typecheck
```

The Next.js CLI integration is experimental and reports native `tsc` diagnostics. It checks the complete project selected by `tsconfig.json`, including test files and generated Next.js types when they are included.

> [!NOTE]
> TypeScript 7.0 does not provide a stable JavaScript Compiler API. Before adding tools that import TypeScript programmatically, confirm their TypeScript 7 compatibility. The Storybook configuration included in this template is verified by `pnpm build-storybook`.
