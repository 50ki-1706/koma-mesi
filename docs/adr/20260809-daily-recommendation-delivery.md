# ADR: 日次推薦の取得・定期生成・API契約配布

- **Status:** Accepted
- **Date:** 2026-08-09

## Context

手動の`recommendation.generate` procedureで、ユーザー1人分の推薦生成とDB保存を確認できるようになった。アプリを開いたユーザーへ保存済み推薦を表示する取得API、毎日の自動生成、フロントエンドと共有できるAPI仕様およびデモデータが必要である。

最終的な実行環境はVercel Cronを想定する。Vercel CronのスケジュールはUTCであり、リクエスト先は公開Route Handlerになる。また、RPC用とSwagger用に別々のAPI契約を管理すると、入力・出力形式がずれる可能性がある。

## Decision

- `recommendation.getDaily` procedureを追加し、ログインセッションのユーザーについて、指定日または日本時間の当日の`completed`バッチを返す。未生成・処理中・失敗の場合は`null`を返す。
- Vercel Cronは`02:00 UTC`、すなわち日本時間11時に`/api/cron/recommendations`を呼ぶ。Route Handlerは`CRON_SECRET`のBearer認証を必須とする。
- Cronは完全な大学座標を持つユーザーを順番に処理する。同日のバッチが存在するユーザーはスキップし、他ユーザーの処理を継続する。部分失敗があれば集計結果とHTTP 500を返す。
- oRPC procedureへOpenAPIのmethod・path・metadataを付与し、`@orpc/openapi`のSwagger providerからUIとOpenAPI JSONを自動生成する。
- Swagger UIは`/api/openapi`、OpenAPI JSONは`/api/openapi/spec.json`で公開する。通常の型安全なクライアントは従来どおり`/api/orpc`を利用する。
- フロントエンド用デモデータは推薦レスポンスのZodスキーマで生成時に検証し、写真を含まない3カテゴリ×3店舗の固定データとして共有する。

## Consequences

- フロントエンドはCronやGoogle Placesを待たず、保存済み推薦APIまたは同じ契約のデモデータで実装できる。
- RPCとREST/OpenAPIは同じoRPCルーターとZodスキーマから生成されるため、仕様の二重管理を避けられる。
- Vercel Cronは失敗時に自動再試行しないため、部分失敗はHTTP 500と件数で監視する必要がある。
- ユーザー数の増加によりVercel Functionの実行時間へ近づく場合は、キューまたはユーザー分割実行を別途設計する必要がある。
