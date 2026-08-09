/**
 * Migration 0019の移行前後で既存の昼食時間データを検証する。
 * 0019で追加された時間形式・順序CHECKが不正値を拒否することも確認する。
 */
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { describe, expect, it } from "vitest";
import { migrateWithEmptyStatementsFiltered } from "./migrate";
import * as schema from "./schema";

const migrationTags = [
  "0000_light_ironclad",
  "0001_famous_titania",
  "0002_black_sunfire",
  "0003_nervous_sebastian_shaw",
  "0004_tranquil_titania",
  "0005_quiet_tattoo",
  "0006_woozy_thaddeus_ross",
  "0007_free_zaran",
  "0008_pretty_johnny_storm",
  "0009_perpetual_red_shift",
  "0010_useful_wind_dancer",
  "0011_handy_rafael_vega",
  "0012_previous_sinister_six",
  "0013_free_thunderbolts",
  "0014_special_lockjaw",
  "0015_foamy_starhawk",
  "0016_amused_proemial_gods",
  "0017_gigantic_clea",
  "0018_romantic_miek",
  "0019_lush_goliath",
] as const;

/**
 * 一時フォルダに実際のマイグレーションSQLとDrizzleジャーナルを用意する。
 *
 * `when`には連番を割り当てる。`migrateWithEmptyStatementsFiltered`は`when`の大小で
 * 未適用のmigrationを判定するため、2回目の呼び出しで追加分のみが適用される。
 *
 * @param migrationsFolder - 作成済みの一時マイグレーションフォルダ。
 * @param includedTags - フォルダに含めるマイグレーションタグ。
 * @returns 一時フォルダの準備完了を示すPromise。
 */
async function populateMigrationsFolder(
  migrationsFolder: string,
  includedTags: readonly string[],
): Promise<void> {
  const sourceFolder = resolve(process.cwd(), "drizzle");
  const metaFolder = join(migrationsFolder, "meta");

  await mkdir(metaFolder, { recursive: true });
  for (const tag of includedTags) {
    await copyFile(
      join(sourceFolder, `${tag}.sql`),
      join(migrationsFolder, `${tag}.sql`),
    );
  }

  await writeFile(
    join(metaFolder, "_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "sqlite",
      entries: includedTags.map((tag, idx) => ({
        idx,
        version: "6",
        when: idx + 1,
        tag,
        breakpoints: true,
      })),
    }),
  );
}

describe("migration 0019 transition", () => {
  it("preserves legacy lunch times and rejects invalid non-null times", async () => {
    const migrationsFolder = await mkdtemp(
      join(tmpdir(), "migrate-transition-test-"),
    );
    const client = createClient({ url: ":memory:" });

    try {
      await populateMigrationsFolder(
        migrationsFolder,
        migrationTags.slice(0, -1),
      );
      await client.execute("PRAGMA foreign_keys = ON");
      const database = drizzle(client, { schema });

      await migrateWithEmptyStatementsFiltered(database, { migrationsFolder });
      await client.execute(
        "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('legacy-boundary', 'Legacy Boundary', 'legacy-boundary@example.com', 1, 1700000000, 1700000000), ('legacy-both-null', 'Legacy Both Null', 'legacy-both-null@example.com', 1, 1700000000, 1700000000), ('legacy-start-null', 'Legacy Start Null', 'legacy-start-null@example.com', 1, 1700000000, 1700000000), ('legacy-end-null', 'Legacy End Null', 'legacy-end-null@example.com', 1, 1700000000, 1700000000)",
      );
      await client.execute(
        "INSERT INTO user_preferences (id, user_id, campus_address, lunch_start_time, lunch_end_time, lunch_days, created_at, updated_at) VALUES ('pref-boundary', 'legacy-boundary', 'Boundary Campus', '00:00', '23:59', 'monday', 1700000000, 1700000000), ('pref-both-null', 'legacy-both-null', 'Both Null Campus', NULL, NULL, NULL, 1700000000, 1700000000), ('pref-start-null', 'legacy-start-null', 'Start Null Campus', NULL, '12:00', NULL, 1700000000, 1700000000), ('pref-end-null', 'legacy-end-null', 'End Null Campus', '12:00', NULL, NULL, 1700000000, 1700000000)",
      );

      await populateMigrationsFolder(migrationsFolder, migrationTags);
      await migrateWithEmptyStatementsFiltered(database, { migrationsFolder });

      const preservedRows = await client.execute(
        "SELECT user_id, lunch_start_time, lunch_end_time FROM user_preferences WHERE user_id LIKE 'legacy-%' ORDER BY user_id",
      );
      expect(preservedRows.rows).toEqual([
        {
          user_id: "legacy-both-null",
          lunch_start_time: null,
          lunch_end_time: null,
        },
        {
          user_id: "legacy-boundary",
          lunch_start_time: "00:00",
          lunch_end_time: "23:59",
        },
        {
          user_id: "legacy-end-null",
          lunch_start_time: "12:00",
          lunch_end_time: null,
        },
        {
          user_id: "legacy-start-null",
          lunch_start_time: null,
          lunch_end_time: "12:00",
        },
      ]);

      const invalidTimes = [
        ["malformed", "9:00", "13:00"],
        ["hour-out-of-range", "24:00", "13:00"],
        ["minute-out-of-range", "12:60", "13:00"],
        ["equal", "12:00", "12:00"],
        ["reversed", "13:00", "12:00"],
      ] as const;

      for (const [label, startTime, endTime] of invalidTimes) {
        const userId = `invalid-${label}`;
        await client.execute({
          sql: "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, 1700000000, 1700000000)",
          args: [userId, label, `${userId}@example.com`],
        });

        await expect(
          client.execute({
            sql: "INSERT INTO user_preferences (id, user_id, campus_address, lunch_start_time, lunch_end_time, created_at, updated_at) VALUES (?, ?, 'Invalid Campus', ?, ?, 1700000000, 1700000000)",
            args: [`pref-${label}`, userId, startTime, endTime],
          }),
        ).rejects.toThrow(/CHECK constraint failed/i);
      }
    } finally {
      client.close();
      await rm(migrationsFolder, { recursive: true, force: true });
    }
  });

  it("normalizes invalid legacy lunch times during migration", async () => {
    const migrationsFolder = await mkdtemp(
      join(tmpdir(), "migrate-transition-test-"),
    );
    const client = createClient({ url: ":memory:" });

    try {
      await populateMigrationsFolder(
        migrationsFolder,
        migrationTags.slice(0, -1),
      );
      await client.execute("PRAGMA foreign_keys = ON");
      const database = drizzle(client, { schema });

      await migrateWithEmptyStatementsFiltered(database, { migrationsFolder });
      await client.execute({
        sql: "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, 1700000000, 1700000000)",
        args: [
          "legacy-invalid-lunch",
          "Legacy Invalid Lunch",
          "legacy-invalid-lunch@example.com",
        ],
      });
      await client.execute({
        sql: "INSERT INTO user_preferences (id, user_id, campus_address, lunch_start_time, lunch_end_time, lunch_days, created_at, updated_at) VALUES (?, ?, 'Legacy Campus', ?, ?, NULL, 1700000000, 1700000000)",
        args: [
          "pref-legacy-invalid-lunch",
          "legacy-invalid-lunch",
          "13:00",
          "12:00",
        ],
      });

      await populateMigrationsFolder(migrationsFolder, migrationTags);
      await migrateWithEmptyStatementsFiltered(database, { migrationsFolder });

      const normalizedRow = await client.execute(
        "SELECT lunch_start_time, lunch_end_time FROM user_preferences WHERE user_id = 'legacy-invalid-lunch'",
      );
      expect(normalizedRow.rows).toEqual([
        {
          lunch_start_time: null,
          lunch_end_time: null,
        },
      ]);
    } finally {
      client.close();
      await rm(migrationsFolder, { recursive: true, force: true });
    }
  });
});
