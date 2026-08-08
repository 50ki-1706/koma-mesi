/**
 * Drizzleマイグレーションのテーブル再構築手順を静的に検証する。
 * 外部キー強制の再有効化後に親テーブルを削除する事故を防止する。
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("database migrations", () => {
  it("外部キー強制の再有効化後にテーブルを削除しない", async () => {
    const migrationsDirectory = path.resolve(process.cwd(), "drizzle");
    const migrationFileNames = (await readdir(migrationsDirectory)).filter(
      (fileName) => /^\d+_.+\.sql$/.test(fileName),
    );

    const unsafeMigrationFileNames: string[] = [];

    for (const fileName of migrationFileNames) {
      const migrationSql = await readFile(
        path.join(migrationsDirectory, fileName),
        "utf8",
      );

      if (
        /PRAGMA\s+foreign_keys\s*=\s*ON\s*;[\s\S]*\bDROP\s+TABLE\b/i.test(
          migrationSql,
        )
      ) {
        unsafeMigrationFileNames.push(fileName);
      }
    }

    expect(unsafeMigrationFileNames).toEqual([]);
  });
});
