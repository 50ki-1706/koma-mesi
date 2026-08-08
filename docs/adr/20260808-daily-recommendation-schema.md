# ADR: 日次飲食店推薦スキーマへの移行

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

従来のジャンル別featured店舗モデルに代わり、Vercel Cronでユーザーごとの日次推薦を生成する。1回の推薦では3カテゴリを選び、カテゴリごとに大学からの距離がnear・middle・farの店舗を1件ずつ、合計9件保存する必要がある。

永続化先はTurso（SQLite）であり、要件上のUUID、timestamptz、decimal、ENUMをSQLiteで表現する必要がある。Better Authが管理する`user`と`session`の定義は変更しない。

## Decision

- `user_preferences`、`recommendation_batches`、`recommendation_categories`、`recommendations`、`restaurants`を追加する。
- UUIDはSQLiteの`text`として保存し、DrizzleからのINSERT時に`crypto.randomUUID()`で生成する。
- timestamptz相当の値は既存スキーマと同じくUnix時刻の`integer`として保存し、Drizzleでは`Date`として扱う。日付だけを表す`target_date`は`text`として保存する。
- 緯度・経度はSQLiteの`real`として保存する。
- ENUM相当の列はDrizzleの列挙型付き`text`とCHECK制約を併用し、型検査とDBの両方で許容値を限定する。
- `recommendation_batches`は`(user_id, target_date)`を一意にする。
- バッチ内のカテゴリとselection_order、カテゴリ内のdistance_groupとdisplay_orderをそれぞれ一意にし、順番は1〜3に制限する。
- 店舗写真は保存せず、`google_place_id`を一意な店舗識別子として保持する。

## Consequences

- 同じユーザー・対象日にバッチが重複せず、1カテゴリ内で距離グループや表示順が重複しない。
- SQLiteにはネイティブなUUID・timestamptz・ENUM型がないため、アプリケーションがPostgreSQLへ移行する場合は各列をネイティブ型へ変更するマイグレーションが必要になる。
- `updated_at`の更新は、レコードを更新するアプリケーション処理が明示的に行う。
- このADRは`20260807-restaurant-recommendation-data-model.md`のデータモデル判断を置き換える。過去ADRは履歴として保持する。
