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

### Prerequisites

- [Git](https://git-scm.com/)
- [Devbox](https://www.jetify.com/docs/devbox/installing-devbox/)

> [!NOTE]
> The Devbox CLI does not run directly on Windows. Use WSL2 or a Dev Container instead.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <cloned-directory>
```

### 2. Prepare the Development Environment

#### Using the Devbox CLI

Install the dependencies.

```bash
devbox run -- pnpm install --frozen-lockfile
```

To use an interactive shell, run `devbox shell`, then run `pnpm <script>` directly.

#### Using VS Code with the Devbox Extension (macOS / Linux)　(Recommended)

1. Install the [Devbox extension](https://marketplace.visualstudio.com/items?itemName=jetpack-io.devbox).
2. Run **Devbox: Reopen in Devbox shell environment** from the Command Palette.
3. After VS Code restarts, run the following command in the integrated terminal.

```bash
pnpm install --frozen-lockfile
```

The Devbox extension also starts a Devbox shell automatically when you open a new integrated terminal in a project that contains `devbox.json`.

#### Using VS Code with a Dev Container

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
2. Run **Dev Containers: Reopen in Container** from the Command Palette.
3. The Devbox-based development environment will be set up automatically.

#### Using VS Code on Windows

In a WSL2 terminal with Devbox installed, navigate to the project directory and run the following commands.

```bash
devbox shell
code .
```

For details, see the [Devbox guide for configuring VS Code](https://www.jetify.com/docs/devbox/ide-configuration/vscode).

#### Using an Editor Other Than VS Code

See the [Devbox IDE configuration guide](https://www.jetify.com/docs/devbox/ide-configuration) for editor-specific instructions.

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure the following environment variables.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Yes | A random 32-byte hexadecimal string. Generate one with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | No | Application base URL. Defaults to `http://localhost:3000` |
| `DATABASE_URL` | No | Database connection string. Defaults to `file:local.db` (SQLite) |

Set the authorized redirect URI for Google OAuth to `http://localhost:3000/api/auth/callback/google`.

### 4. Set Up the Database

```bash
pnpm db:push
# Via the Devbox CLI
devbox run -- pnpm db:push
```

This creates `local.db` with all required tables.

To use version-controlled migrations instead, run the following commands.

```bash
pnpm db:generate
pnpm db:migrate
# Via the Devbox CLI
devbox run -- pnpm db:generate
devbox run -- pnpm db:migrate
```

### 5. Start the Development Server

```bash
pnpm dev
# Via the Devbox CLI
devbox run -- pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## TypeScript 7

This template uses the native TypeScript 7 compiler. Next.js 16.3 runs the project-local `tsc` CLI during production builds by default, so no additional configuration is required.

Run type checking independently with the following command.

```bash
pnpm typecheck
```

The Next.js CLI integration is experimental and reports native `tsc` diagnostics. It checks the complete project selected by `tsconfig.json`, including test files and generated Next.js types when they are included.

> [!NOTE]
> TypeScript 7.0 does not provide a stable JavaScript Compiler API. Before adding tools that import TypeScript programmatically, confirm their TypeScript 7 compatibility. The Storybook configuration included in this template is verified by `pnpm build-storybook`.

## Storybook

Start Storybook to develop UI components.

```bash
pnpm storybook
# Via the Devbox CLI
devbox run -- pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006) in your browser.
