// SQLite の CHECK 制約で利用する文字列リテラル一覧を生成する。
// アプリケーションの定数と DB 制約の値集合を同期させる。

import { type SQL, sql } from "drizzle-orm";

/**
 * 文字列の配列を SQLite の IN 句で使えるリテラル一覧へ変換する。
 *
 * @param values - SQL リテラルへ変換する文字列の配列
 * @returns カンマ区切りの SQL リテラル一覧
 */
export function sqliteStringLiterals(values: readonly string[]): SQL {
  const escapedValues = values.map(
    (value) => `'${value.replaceAll("'", "''")}'`,
  );

  return sql.raw(escapedValues.join(", "));
}
