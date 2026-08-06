# next-starter

[English](./README.md)

[![Built with Devbox](https://www.jetify.com/img/devbox/shield_galaxy.svg)](https://www.jetify.com/devbox/docs/contributor-quickstart/)

Next.js を使用したフルスタックアプリケーションのスターターテンプレートです。開発環境、認証、データベース、テストなど、開発に必要なツールと設定をまとめています。

## 主な機能

### 実行環境・開発環境

- [Node.js 26.4.0](https://nodejs.org/) — JavaScript ランタイム
- [pnpm 11.1.2](https://pnpm.io/) — 高速で効率的なパッケージマネージャー
- [cocogitto 7.0.0](https://docs.cocogitto.io/) — コミットメッセージを検証する Git フックツール
- [Devbox](https://www.jetify.com/devbox/) — 再現可能な開発環境を提供するツールチェーンマネージャー
- [Dev Containers](https://containers.dev/) — VS Code でコンテナ化された開発環境を利用するための仕組み
- [SQLite](https://www.sqlite.org/index.html) — 軽量な組み込み型 SQL データベース

### フレームワーク・ライブラリ

- [Next.js 16.3](https://nextjs.org/) — フルスタックアプリケーションを構築する React フレームワーク
- [Better Auth](https://better-auth.com) — TypeScript 向けの認証ライブラリ
- [Tailwind CSS](https://tailwindcss.com/) — ユーティリティファーストの CSS フレームワーク
- [oRPC](https://orpc.dev) — 型安全で OpenAPI に対応した RPC フレームワーク
- [Zod](https://zod.dev/) — TypeScript ファーストのスキーマバリデーションライブラリ
- [Drizzle ORM](https://orm.drizzle.team/) — SQL データベース向けの TypeScript ORM

### 開発支援・品質保証

- [TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — ネイティブ実装の TypeScript コンパイラと型チェッカー
- [Biome](https://biomejs.dev/) — 高速なコードフォーマッター兼リンター
- [Vitest](https://vitest.dev/) — Vite ベースのユニットテストフレームワーク
- [Storybook](https://storybook.js.org/) — UI コンポーネントを単独で開発するためのツール

## セットアップ

### 前提条件

- [Git](https://git-scm.com/)
- [Devbox](https://www.jetify.com/docs/devbox/installing-devbox/)

> [!NOTE]
> Windows では Devbox CLI を直接利用できないため、WSL2 または Dev Container を使用してください。

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd <cloned-directory>
```

### 2. 開発環境の準備

#### Devbox CLI を使用する場合

依存関係をインストールします。

```bash
devbox run -- pnpm install --frozen-lockfile
```

対話型シェルを利用する場合は、`devbox shell` を実行した後、`pnpm <script>` を直接実行できます。

#### VS Code と Devbox 拡張機能を使用する場合（macOS / Linux） (推奨)

1. [Devbox 拡張機能](https://marketplace.visualstudio.com/items?itemName=jetpack-io.devbox)をインストールします。
2. コマンドパレットから **Devbox: Reopen in Devbox shell environment** を実行します。
3. VS Code の再起動後、統合ターミナルで次のコマンドを実行します。

```bash
pnpm install --frozen-lockfile
```

Devbox 拡張機能は、`devbox.json` があるプロジェクトで新しい統合ターミナルを開いた場合にも Devbox シェルを自動的に起動します。

#### VS Code と Dev Container を使用する場合

1. [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)をインストールします。
2. コマンドパレットから **Dev Containers: Reopen in Container** を実行します。
3. DevBoxベースの開発環境がセットアップされます。

#### Windows で VS Code を使用する場合

Devbox をインストールした WSL2 のターミナルで、プロジェクトディレクトリに移動してから次のコマンドを実行します。

```bash
devbox shell
code .
```

詳しくは [Devbox の VS Code 設定ガイド](https://www.jetify.com/docs/devbox/ide-configuration/vscode)を参照してください。

#### VS Code 以外のエディタを使用する場合

エディタごとの設定方法は [Devbox の IDE 設定ガイド](https://www.jetify.com/docs/devbox/ide-configuration)を参照してください。

### 3. 環境変数の設定

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

### 4. データベースのセットアップ

```bash
pnpm db:push
# devbox cli経由
devbox run -- pnpm db:push
```

必要なテーブルを含む `local.db` が作成されます。

バージョン管理されたマイグレーションを使用する場合は、代わりに次のコマンドを実行してください。

```bash
pnpm db:generate
pnpm db:migrate
# devbox cli経由
devbox run -- pnpm db:generate
devbox run -- pnpm db:migrate
```

### 5. 開発サーバーの起動

```bash
pnpm dev
# devbox cli経由
devbox run -- pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## TypeScript 7

このテンプレートでは、ネイティブ実装の TypeScript 7 コンパイラを使用します。Next.js 16.3 は本番ビルド時にプロジェクト内の `tsc` CLI をデフォルトで実行するため、追加設定は必要ありません。

型チェックだけを実行する場合は、次のコマンドを使用します。

```bash
pnpm typecheck
```

Next.js の CLI 連携は実験的な機能で、TypeScript 標準の `tsc` 診断を出力します。`tsconfig.json` で選択されたプロジェクト全体が検査対象となり、設定に含まれるテストファイルや Next.js の生成型も検査されます。

> [!NOTE]
> TypeScript 7.0 は安定版の JavaScript Compiler API を提供していません。TypeScript をプログラムから読み込むツールを追加する場合は、TypeScript 7 への対応状況を確認してください。このテンプレートの Storybook 構成は、`pnpm build-storybook` で動作を確認しています。

## Storybook

UI コンポーネントを開発する場合は Storybook を起動します。

```bash
pnpm storybook
# devbox cli経由
devbox run -- pnpm storybook
```

[http://localhost:6006](http://localhost:6006) をブラウザで開いてください。
