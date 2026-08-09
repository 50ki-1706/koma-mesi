# ADR: 本番環境のAPIドキュメント公開制御

- **Status:** Accepted
- **Date:** 2026-08-09

## Context

oRPCから生成するSwagger UIとOpenAPI JSONには、APIのパス、入出力Schema、カテゴリ定義が含まれる。開発環境ではフロントエンド開発とAPI確認に必要だが、本番環境で常時公開する必要はない。

## Decision

- 開発環境ではSwagger UIとOpenAPI JSONを既定で有効にする。
- 本番環境では両方を既定で無効にする。
- 本番環境で公開が必要な場合に限り、`ENABLE_API_DOCS=true`を設定する。
- REST互換APIのルーティングはドキュメント公開設定にかかわらず維持する。

## Consequences

- 本番環境でAPI構造が意図せず列挙されることを防げる。
- 本番環境でAPI仕様を利用する場合は、環境変数による明示的な公開判断が必要になる。
- API自体の認証・認可は従来どおり各oRPC procedureで実施する。
