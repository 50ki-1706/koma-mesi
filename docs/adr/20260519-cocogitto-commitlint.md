# ADR: cocogitto による Conventional Commit 検証の導入

- **Status:** Accepted
- **Date:** 2026-05-19

## Context

チーム開発においてコミットメッセージの一貫性を保つため、ローカルでの commitlint を導入する。
コミットメッセージが [Conventional Commits](https://www.conventionalcommits.org/) 仕様に従っていない場合、
コミットを拒否する仕組みが必要。

ツールの選定にあたり、以下の要件を満たすものを検討した：

- ローカルの git hook として動作すること
- 設定ファイルをバージョン管理できること
- CI に依存せず、開発者のローカル環境で即時にフィードバックが得られること

## Decision

**cocogitto** を採用し、commit-msg hook を導入する。

選定理由：

- mise.toml でバージョン管理済み（`cocogitto = "latest"`）であり、開発環境への導入が容易
- `cog.toml` をバージョン管理することで、許可する commit type をチームで共有できる
- `cog install-hook` により commit-msg hook のセットアップが自動化されている
- Rust 製で高速に動作する
- scope 付きコミット（`feat(api): ...`）や breaking change（`feat!: ...`）に標準対応している

許可する commit type：

| type | 説明 |
|------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメントのみの変更 |
| style | コードの意味に影響しない変更（空白、フォーマット、セミコロンなど） |
| refactor | バグ修正でも機能追加でもないコード変更 |
| perf | パフォーマンス改善 |
| test | テストの追加・修正 |
| build | ビルドシステムや外部依存に関する変更 |
| ci | CI 設定やスクリプトの変更 |
| chore | その他の変更（上記に当てはまらないもの） |
| revert | 以前のコミットを revert する |

commit-msg hook のセットアップは `scripts/setup.sh` で行い、`bash scripts/setup.sh` の 1 コマンドで完了する。

## Consequences

- すべてのコミットメッセージが conventional commit 形式に強制される
- 開発者はコミット時に即座にフィードバックを得られる
- `cog.toml` の変更は即座に反映される（hook 実行時に参照されるため）
- 既存の `.git/hooks/commit-msg` がある場合は上書き前に確認・バックアップが行われる
