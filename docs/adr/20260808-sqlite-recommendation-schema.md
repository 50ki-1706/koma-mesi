# ADR: 推薦データを Turso/SQLite の正規化テーブルで保持する

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

昼休み前の定期処理で、ユーザーごとに3カテゴリ、カテゴリごとに near / middle / far の3店舗、合計9店舗を推薦する。推薦結果は対象日単位で再取得でき、同じ店舗は複数の日やカテゴリで再利用できる必要がある。

論理設計では UUID、`timestamptz`、ENUM、`decimal` を想定している。一方、現在のプロジェクトは Drizzle ORM と Turso/SQLite を採用しており、Better Auth の `user.id` は `text` である。

## Decision

推薦データを以下の方針で保持する。

- Better Auth の既存 `user` テーブルは変更せず、`user_preferences.user_id` と `recommendation_batches.user_id` も `text` にする
- UUID はアプリケーションで生成する UUID 文字列として SQLite の `text` に保存する
- 日時は既存スキーマに合わせ、Drizzle の timestamp mode を指定した Unix 時刻の `integer` に保存する
- 対象日は `YYYY-MM-DD` 形式を想定した `text`、緯度経度は SQLite の `real` に保存する
- ENUM 相当の値は TypeScript の定数で型付けし、同じ値集合から生成した `CHECK` 制約でも検証する
- `recommendation_batches` は `(user_id, target_date)` を一意にする
- バッチ内のカテゴリ、カテゴリ内の距離グループと表示順を一意にし、順番は `CHECK` 制約で 1〜3 に制限する
- `recommendations` の `batch_id` と `recommendation_category_id` は複合外部キーにし、異なるバッチのカテゴリを誤って関連付けられないようにする
- 店舗写真は保存せず、`restaurants.google_place_id` を使って表示時に外部 API から取得する
- ユーザーまたは推薦バッチを削除した場合、その配下の設定・推薦結果はカスケード削除する。店舗マスタは推薦履歴から参照されるため自動削除しない

## Consequences

- 現在の Turso/SQLite 構成を維持したまま、論理設計の型と整合性を表現できる
- アプリケーションの型検査だけでなく、DB に直接書き込まれた場合もカテゴリ、状態、順番の不正値を拒否できる
- PostgreSQL のネイティブ UUID、ENUM、`timestamptz` と同じ物理表現ではないため、将来 PostgreSQL へ移行する場合は型変換が必要になる
- 1バッチにつきカテゴリが必ず3件、推薦が必ず9件存在することは、処理途中の `pending` / `processing` 状態を許容するためDB制約では保証せず、推薦サービスの完了処理で保証する
