# ADR: Devbox を標準のローカル/CI ツールチェーンとして採用

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

これまでリポジトリは `mise.toml` で Node.js と cocogitto を管理し、開発者は各自で mise、Cargo、Homebrew などからツールをインストールする方法を選んでいた。しかし、この方式には以下の課題があった:

- 開発者ごとにインストール元が異なり、バージョンが揃わないリスクがある
- CI とローカルで Node.js や pnpm のセットアップ手順が異なる
- ツールのインストール方法を README やスクリプト内で複数案内する必要があり、手順が複雑になる

一方、Devbox は `devbox.json` と `devbox.lock` を使って Node.js、pnpm、cocogitto を宣言的に管理でき、Nix ストアを介して再現性の高い環境を提供する。これにより、ローカルと CI で同一のツールチェーンを共有できる。

## Decision

**Devbox** をリポジトリがサポートする唯一のローカル/CI ツールチェーンとして採用する。

具体的な方針:

- `devbox.json` に Node.js 26.4.0、pnpm 11.1.2、cocogitto 7.0.0 を宣言する
- `devbox.lock` をコミットし、すべての環境で同一のバージョンが解決されるようにする
- `mise.toml` を削除し、mise によるツール管理を終了する
- `.devbox/` を `.gitignore` に追加し、Devbox によって生成されるディレクトリを追跡対象外とする
- README やセットアップスクリプト内のツールインストール手順を Devbox のみに統一する
- GitHub Actions では `jetify-com/devbox-install-action` を使用し、キャッシュを有効にする
- すべての CI ステップは `devbox run -- pnpm ...` の形式で実行する

本決定は `docs/adr/20260519-cocogitto-commitlint.md` の「cocogitto を導入する」という判断自体は維持し、当時の前提であった「mise.toml でバージョン管理する」部分のみを置き換える。したがって、2026-05-19 の ADR は履歴資料として変更しない。

## Consequences

- 開発者は Devbox を前提とする手順のみを実行すればよくなり、README とスクリプトが簡潔になる
- ローカルと CI でまったく同じ Node.js、pnpm、cocogitto のバージョンが使用される
- `devbox.lock` をコミットすることで、依存解決の再現性が高まる
- `.devbox/` を無視することで、生成ファイルが誤ってコミットされるのを防ぐ
- CI の Devbox インストールはキャッシュにより短縮されるが、初回実行時や `devbox.lock` 変更時は Nix ストアのダウンロードで時間がかかる場合がある
- mise、Cargo、Homebrew による cocogitto の代替インストール方法は README から削除する
