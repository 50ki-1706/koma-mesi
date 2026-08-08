[README に戻る](../../../README.ja.md)

# Linux セットアップガイド

## 前提条件

- [Git](https://git-scm.com/)
- [Devbox](https://www.jetify.com/devbox/docs/installing-devbox/#macos-linux)

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd <cloned-directory>
```

## 2. 開発環境の準備

### VS Code と Devbox 拡張機能を使用する場合（推奨）

1. [Devbox 拡張機能](https://marketplace.visualstudio.com/items?itemName=jetpack-io.devbox)をインストールします。
2. コマンドパレットから **Devbox: Reopen in Devbox shell environment** を実行します。
3. VS Code の再起動後、統合ターミナルで次のコマンドを実行します。

```bash
pnpm install --frozen-lockfile
```

Devbox 拡張機能は、`devbox.json` があるプロジェクトで新しい統合ターミナルを開いた場合にも Devbox シェルを自動的に起動します。

### Devbox CLI を使用する場合

依存関係をインストールします。

```bash
devbox run -- pnpm install --frozen-lockfile
```

対話型シェルを利用する場合は、`devbox shell` を実行した後、`pnpm <script>` を直接実行できます。

### VS Code と Dev Container を使用する場合

1. [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)をインストールします。
2. コンテナランタイム（Docker Engine など）が動作していることを確認してください。
3. コマンドパレットから **Dev Containers: Reopen in Container** を実行します。
4. Devbox ベースの開発環境がセットアップされます。

### VS Code 以外のエディタを使用する場合

エディタごとの設定方法は [Devbox の IDE 設定ガイド](https://www.jetify.com/docs/devbox/ide-configuration)を参照してください。

## 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集し、以下の環境変数を設定してください。

| 変数 | 必須 | 説明 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | はい | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | はい | Google OAuth クライアントシークレット |
| `BETTER_AUTH_SECRET` | はい | ランダムな 32 バイトの 16 進数文字列。`openssl rand -hex 32` で生成できます |
| `BETTER_AUTH_URL` | いいえ | アプリケーションのベース URL。デフォルトは `http://localhost:3000` |
| `DATABASE_URL` | いいえ | データベース接続文字列。デフォルトは `file:local.db`（SQLite） |

Google OAuth の承認済みリダイレクト URI には、`http://localhost:3000/api/auth/callback/google` を設定してください。

## 4. データベースのセットアップ

[Devbox シェル](#2-開発環境の準備)内（`devbox shell` 後、VS Code の Devbox 統合ターミナル、または Dev Container 内）で実行します。

```bash
pnpm db:push
```

Devbox シェルに入らずに実行する場合は `devbox run --` を前置します。

```bash
devbox run -- pnpm db:push
```

必要なテーブルを含む `local.db` が作成されます。

バージョン管理されたマイグレーションを使用する場合は、代わりに次のコマンドを実行してください。

```bash
pnpm db:generate
pnpm db:migrate
```

または:

```bash
devbox run -- pnpm db:generate
devbox run -- pnpm db:migrate
```

## 5. 開発サーバーの起動

```bash
pnpm dev
```

または:

```bash
devbox run -- pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## Storybook

UI コンポーネントを開発する場合は Storybook を起動します。

```bash
pnpm storybook
```

または:

```bash
devbox run -- pnpm storybook
```

[http://localhost:6006](http://localhost:6006) をブラウザで開いてください。
