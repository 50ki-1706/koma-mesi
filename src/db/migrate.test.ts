/**
 * Custom migration runner の動作を検証するテスト。
 * 正常系と外部キー違反検出の振る舞いを確認する。
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { runMigrations } from "./migrate";

/**
 * テスト用の一時マイグレーションフォルダを作成する。
 *
 * @param tag - マイグレーションファイルのタグ名。
 * @param sqlContent - マイグレーションSQLの内容。
 * @returns 作成したマイグレーションフォルダの絶対パス。
 */
async function createTempMigrationsFolder(
  tag: string,
  sqlContent: string,
): Promise<string> {
  const migrationsFolder = await mkdtemp(join(tmpdir(), "migrate-test-"));
  const metaFolder = join(migrationsFolder, "meta");
  await mkdir(metaFolder);

  await writeFile(
    join(metaFolder, "_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "sqlite",
      entries: [
        {
          idx: 0,
          version: "6",
          when: Date.now(),
          tag,
          breakpoints: true,
        },
      ],
    }),
  );

  await writeFile(join(migrationsFolder, `${tag}.sql`), sqlContent);

  return migrationsFolder;
}

describe("runMigrations", () => {
  test("completes successfully on a valid database", async () => {
    const databaseUrl = ":memory:";
    const migrationsFolder = await createTempMigrationsFolder(
      "0000_valid",
      "CREATE TABLE example (id TEXT PRIMARY KEY);",
    );

    try {
      await expect(
        runMigrations({ databaseUrl, migrationsFolder }),
      ).resolves.toBeUndefined();
    } finally {
      await rm(migrationsFolder, { recursive: true, force: true });
    }
  });

  test("detects foreign key violations by creating orphaned references", async () => {
    const databaseUrl = ":memory:";
    const migrationsFolder = await createTempMigrationsFolder(
      "0000_orphaned",
      [
        "CREATE TABLE parent (id TEXT PRIMARY KEY);",
        "--> statement-breakpoint",
        "CREATE TABLE child (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parent(id));",
        "--> statement-breakpoint",
        "INSERT INTO child VALUES ('child-1', 'missing-parent');",
      ].join("\n"),
    );

    try {
      await expect(
        runMigrations({ databaseUrl, migrationsFolder }),
      ).rejects.toThrow(/Foreign key violations found after migration/);
    } finally {
      await rm(migrationsFolder, { recursive: true, force: true });
    }
  });
});
