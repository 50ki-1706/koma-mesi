[Back to README](../../../README.md)

# Windows Setup Guide

> [!NOTE]
> Since Devbox CLI cannot be used directly on Windows, please work inside WSL2.

## Prerequisites

- [Git](https://git-scm.com/)
- [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Devbox](https://www.jetify.com/devbox/docs/installing-devbox/#macos-linux) (installed inside WSL2)

## 1. Clone the repository

We recommend cloning inside the WSL2 filesystem.

```bash
git clone <repository-url>
cd <cloned-directory>
```

## 2. Prepare the development environment

### Using WSL2 and VS Code (recommended)

1. Install Devbox inside WSL2.
2. Install the [WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) in VS Code.
3. In the WSL2 terminal, move to the project directory and run the following commands.

```bash
devbox shell
code .
```

4. Run the following command in VS Code's integrated terminal.

```bash
pnpm install --frozen-lockfile
```

For more details, see the [Devbox VS Code configuration guide](https://www.jetify.com/docs/devbox/ide-configuration/vscode).

### Using VS Code and Dev Container

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
2. Make sure Docker Desktop with WSL2 backend is running.
3. Run **Dev Containers: Reopen in Container** from the command palette.
4. The Devbox-based development environment will be set up.

### Using Devbox CLI

In the WSL2 terminal, move to the project directory and install dependencies.

```bash
devbox run -- pnpm install --frozen-lockfile
```

To use an interactive shell, run `devbox shell`, then you can run `pnpm <script>` directly.

### Using an editor other than VS Code

See the [Devbox IDE configuration guide](https://www.jetify.com/docs/devbox/ide-configuration) for setup instructions for each editor.

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set the following environment variables.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Yes | A random 32-byte hexadecimal string. Can be generated with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | No | The application base URL. Defaults to `http://localhost:3000` |
| `DATABASE_URL` | No | Database connection string. Defaults to `file:local.db` (SQLite) |

For Google OAuth, set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google`.

## 4. Set up the database

Run this inside the [Devbox shell](#2-prepare-the-development-environment) (after `devbox shell`, in VS Code's Devbox integrated terminal, or inside a Dev Container).

```bash
pnpm db:push
```

If running without entering the Devbox shell, prefix with `devbox run --`.

```bash
devbox run -- pnpm db:push
```

This creates `local.db` with the required tables.

If using versioned migrations, run these commands instead.

```bash
pnpm db:generate
pnpm db:migrate
```

Or:

```bash
devbox run -- pnpm db:generate
devbox run -- pnpm db:migrate
```

## 5. Start the development server

```bash
pnpm dev
```

Or:

```bash
devbox run -- pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Storybook

When developing UI components, start Storybook.

```bash
pnpm storybook
```

Or:

```bash
devbox run -- pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006) in your browser.

> [!NOTE]
> Run all commands inside WSL2.
