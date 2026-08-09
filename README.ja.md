# koma-mesi
[![Built with Devbox](https://www.jetify.com/img/devbox/shield_galaxy.svg)](https://www.jetify.com/devbox/docs/contributor-quickstart/)
[English](./README.md)

koma-mesiは、大学の限られた昼休みの時間を、効率的に、そして楽しく過ごすための、**ランチマッチングアプリ**です。

## 使い方
1. 大学の住所を登録します。
2. 登録した大学の住所を元に、昼休みに行けるお店を昼休み前にバックエンドがリサーチを行います。
3. 昼休みになったら、アプリを開き、リサーチされたお店の中から、行きたいお店を選択！
4. 効率的で楽しい昼休みを過ごしましょう！

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

## setup

| OS | docs |
|---|---|
| macOS | [docs/setup/mac/README.ja.md](./docs/setup/mac/README.ja.md) |
| Linux | [docs/setup/linux/README.ja.md](./docs/setup/linux/README.ja.md) |
| Window(wsl2) | [docs/setup/windows/README.ja.md](./docs/setup/windows/README.ja.md) |

## APIドキュメント

開発サーバー起動後、[http://localhost:3000/api/openapi](http://localhost:3000/api/openapi) で apiドキュメント (Swagger UI) にアクセスできます。
