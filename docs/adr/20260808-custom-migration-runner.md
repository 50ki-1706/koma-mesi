# ADR: カスタムマイグレーションランナーの導入

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

本プロジェクトではTurso（SQLite）をデータベースとして使用し、Drizzle ORMでスキーマとマイグレーションを管理している。これまでは`drizzle-kit migrate`コマンドを使ってマイグレーションを実行していた。

CodeRabbitのレビュー指摘により、SQLiteにおける外部キー制約の整合性をマイグレーション後に検証する必要性が生じた。SQLiteは`PRAGMA foreign_keys = ON`を指定しても、マイグレーション中の既存データに対する外部キー違反を自動的には検出・中断しないケースがあり、データ不整合が残るリスクがある。

## Decision

`drizzle-kit migrate`の代わりに、Drizzle ORMのマイグレーションAPIを使ったカスタムマイグレーションランナーを実装し、すべてのマイグレーション適用後に`PRAGMA foreign_key_check`を実行する。

具体的な方針:

- `drizzle-kit migrate`ではなく、Node.jsスクリプト（`src/db/migrate.ts`など）から`migrate()`関数を呼び出す。
- マイグレーション完了後、同じトランザクションまたは同一接続内で`PRAGMA foreign_key_check`を実行する。
- `foreign_key_check`が違反を検出した場合は、プロセスを非ゼロステータスで終了させ、CIやデプロイフローで失敗を検知できるようにする。
- 実行コマンドは`package.json`の`db:migrate`スクリプトをカスタムランナーに置き換える。

## Consequences

- マイグレーション適用後に外部キー違反を自動検出できるようになり、CodeRabbitの指摘に対応できる。
- `drizzle-kit`のCLIと比べ、マイグレーション前後のフックやログ出力を自由に制御できる。
- `foreign_key_check`はマイグレーションコミット後の検証となるため、違反が検出されても既存の変更が自動的にロールバックされるわけではない。検出後に手動または別途の修復スクリプトで対応する必要がある。
- 検出した違反を検知する仕組みは整うが、 atomic rollback は提供しない。post-commit validation と atomic rollback のトレードオフを「検出優先」で選択した。
- カスタムランナーのメンテナンスコストが発生する。Drizzle ORMのAPI変更やTurso固有の制約に追随する必要がある。

## References

- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations)
- [SQLite PRAGMA foreign_key_check](https://www.sqlite.org/pragma.html#pragma_foreign_key_check)
- CodeRabbit review feedback: SQLite foreign key integrity after migrations
