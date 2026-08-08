[Back to README](../../../README.md)

# macOS Setup Guide

## Prerequisites

- [Git](https://git-scm.com/)
- [Devbox](https://www.jetify.com/devbox/docs/installing-devbox/#macos-linux)

## 1. Clone the Repository

```bash
git clone <repository-url>
cd <cloned-directory>
```

## 2. Prepare the Development Environment

### Using VS Code with the Devbox Extension (Recommended)

1. Install the [Devbox extension](https://marketplace.visualstudio.com/items?itemName=jetpack-io.devbox).
2. Run **Devbox: Reopen in Devbox shell environment** from the Command Palette.
3. After VS Code restarts, run the following command in the integrated terminal.

```bash
pnpm install --frozen-lockfile
```

The Devbox extension also automatically starts the Devbox shell when opening a new integrated terminal in a project that has a `devbox.json`.

### Using the Devbox CLI

Install dependencies.

```bash
devbox run -- pnpm install --frozen-lockfile
```

If you are using an interactive shell, you can run `devbox shell` and then execute `pnpm <script>` directly.

### Using VS Code with Dev Containers

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
2. Make sure a container runtime (such as Docker Desktop) is running.
3. Run **Dev Containers: Reopen in Container** from the Command Palette.
4. The Devbox-based development environment will be set up.

### Using an Editor Other Than VS Code

Refer to the [Devbox IDE configuration guide](https://www.jetify.com/docs/devbox/ide-configuration) for setup instructions for your editor.

## 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set the following environment variables.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Yes | A random 32-byte hex string. Can be generated with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | No | The application base URL. Defaults to `http://localhost:3000` |
| `DATABASE_URL` | No | Database connection string. Defaults to `file:local.db` (SQLite) |

For the Google OAuth authorized redirect URI, set `http://localhost:3000/api/auth/callback/google`.

## 4. Set Up the Database

Run inside the [Devbox shell](#2-prepare-the-development-environment) (after `devbox shell`, in the VS Code Devbox integrated terminal, or inside the Dev Container).

```bash
pnpm db:push
```

If running without entering the Devbox shell, prefix the command with `devbox run --`.

```bash
devbox run -- pnpm db:push
```

This creates a `local.db` containing the required tables.

If you are using version-controlled migrations, run the following commands instead:

```bash
pnpm db:generate
pnpm db:migrate
```

Or:

```bash
devbox run -- pnpm db:generate
devbox run -- pnpm db:migrate
```

## 5. Start the Development Server

```bash
pnpm dev
```

Or:

```bash
devbox run -- pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Storybook

Start Storybook when developing UI components.

```bash
pnpm storybook
```

Or:

```bash
devbox run -- pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006) in your browser.
