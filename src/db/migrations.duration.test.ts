/**
 * SQLiteマイグレーション 0014/0015 における duration データの保持と単位変換を検証する。
 * 0014 で duration_minutes が失われず、0015 で分から秒へ正しく変換されることを確認する。
 */
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { describe, expect, test } from "vitest";
import { runMigrations } from "./migrate";

/**
 * drizzle マイグレーションジャーナルのエントリを表す。
 */
interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

/**
 * drizzle マイグレーションジャーナルを表す。
 */
interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

/**
 * 指定したインデックスまでのマイグレーションを一時フォルダにコピーする。
 *
 * @param targetDir - マイグレーションファイルを配置する一時ディレクトリ。
 * @param maxIdx - 含める最大のマイグレーションインデックス。
 * @returns 作成したジャーナル。
 */
async function prepareMigrationsFolder(
  targetDir: string,
  maxIdx: number,
): Promise<Journal> {
  const sourceDir = join(process.cwd(), "drizzle");
  const metaDir = join(targetDir, "meta");
  await mkdir(metaDir, { recursive: true });

  const fullJournal: Journal = JSON.parse(
    await readFile(join(sourceDir, "meta", "_journal.json"), "utf8"),
  ) as Journal;
  const journal: Journal = {
    ...fullJournal,
    entries: fullJournal.entries.filter((entry) => entry.idx <= maxIdx),
  };

  await writeFile(
    join(metaDir, "_journal.json"),
    JSON.stringify(journal, null, 2),
  );

  for (const entry of journal.entries) {
    await copyFile(
      join(sourceDir, `${entry.tag}.sql`),
      join(targetDir, `${entry.tag}.sql`),
    );
  }

  return journal;
}

/**
 * 推薦データの検証に必要な親テーブルを seed する。
 *
 * @param client - 対象の LibSQL クライアント。
 */
async function seedParentTables(
  client: ReturnType<typeof createClient>,
): Promise<void> {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.execute(
    `INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
     VALUES ('user-test', 'Test User', 'test@example.com', 0, 0, 0)`,
  );
  await client.execute(
    `INSERT INTO recommendation_batches (id, user_id, target_date, status, created_at)
     VALUES ('batch-test', 'user-test', '2026-08-09', 'completed', 0)`,
  );
  await client.execute(
    `INSERT INTO recommendation_categories (id, batch_id, category, created_at)
     VALUES ('category-test', 'batch-test', '和食', 0)`,
  );
}

/**
 * 3 店舗のレストランマスタを seed する。
 *
 * @param client - 対象の LibSQL クライアント。
 * @returns 作成したレストラン ID の配列。
 */
async function seedRestaurants(
  client: ReturnType<typeof createClient>,
): Promise<string[]> {
  const restaurantIds: string[] = [];
  for (let index = 1; index <= 3; index++) {
    const restaurantId = `restaurant-test-${index}`;
    restaurantIds.push(restaurantId);
    await client.execute({
      sql: `INSERT INTO restaurants (id, google_place_id, name, address, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        restaurantId,
        `place-test-${index}`,
        `Test Restaurant ${index}`,
        `Test Address ${index}`,
        35.681236,
        139.767125,
        0,
        0,
      ],
    });
  }
  return restaurantIds;
}

/**
 * 検証用の推薦データを recommendations テーブルに挿入する。
 *
 * @param client - 対象の LibSQL クライアント。
 * @param restaurantIds - 紐づけるレストラン ID の配列。
 * @param durations - 各距離帯に設定する duration_minutes の配列。
 */
async function seedRecommendations(
  client: ReturnType<typeof createClient>,
  restaurantIds: string[],
  durations: number[],
): Promise<void> {
  const distanceGroups = ["near", "middle", "far"] as const;
  for (let index = 0; index < distanceGroups.length; index++) {
    const distanceGroup = distanceGroups[index];
    const distanceMeters = (index + 1) * 100;
    await client.execute({
      sql: `INSERT INTO recommendations (
         id, batch_id, recommendation_category_id, restaurant_id,
         distance_group, distance_meters, duration_minutes, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `rec-test-${distanceGroup}`,
        "batch-test",
        "category-test",
        restaurantIds[index],
        distanceGroup,
        distanceMeters,
        durations[index],
        0,
      ],
    });
  }
}

describe("database migrations duration data preservation", () => {
  /**
   * 0014 で duration_minutes が保持され、0015 で秒単位に正しく変換されることを検証する。
   */
  test("preserves duration_minutes through 0014 and converts to seconds in 0015", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migration-duration-"));
    const databasePath = join(tempDir, "test.db");
    const databaseUrl = `file:${databasePath}`;

    try {
      // 0013 までのマイグレーションを適用し、0014 適用前のスキーマを再現する。
      await prepareMigrationsFolder(tempDir, 13);
      await runMigrations({ databaseUrl, migrationsFolder: tempDir });

      const seedClient = createClient({ url: databaseUrl });
      try {
        await seedParentTables(seedClient);
        await seedClient.execute(
          "ALTER TABLE recommendations ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0",
        );
        const restaurantIds = await seedRestaurants(seedClient);
        await seedRecommendations(seedClient, restaurantIds, [15, 30, 45]);
      } finally {
        seedClient.close();
      }

      // 0014 を適用し、duration_minutes が保持されることを確認する。
      await prepareMigrationsFolder(tempDir, 14);
      await runMigrations({ databaseUrl, migrationsFolder: tempDir });

      const after0014Client = createClient({ url: databaseUrl });
      try {
        const result = await after0014Client.execute(
          "SELECT id, duration_minutes FROM recommendations ORDER BY duration_minutes",
        );
        expect(result.rows).toEqual([
          { id: "rec-test-near", duration_minutes: 15 },
          { id: "rec-test-middle", duration_minutes: 30 },
          { id: "rec-test-far", duration_minutes: 45 },
        ]);
      } finally {
        after0014Client.close();
      }

      // 0015 を適用し、分から秒への変換が正しく行われることを確認する。
      await prepareMigrationsFolder(tempDir, 15);
      await runMigrations({ databaseUrl, migrationsFolder: tempDir });

      const after0015Client = createClient({ url: databaseUrl });
      try {
        const result = await after0015Client.execute(
          "SELECT id, campus_to_restaurant_seconds FROM recommendations ORDER BY campus_to_restaurant_seconds",
        );
        expect(result.rows).toEqual([
          { id: "rec-test-near", campus_to_restaurant_seconds: 900 },
          { id: "rec-test-middle", campus_to_restaurant_seconds: 1800 },
          { id: "rec-test-far", campus_to_restaurant_seconds: 2700 },
        ]);
      } finally {
        after0015Client.close();
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
