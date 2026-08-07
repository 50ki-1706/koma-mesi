/**
 * 日次飲食店推薦スキーマと生成マイグレーションの統合テストを行う。
 * テーブル間の保存経路と主要なDB制約がSQLiteで機能することを検証する。
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";
import * as schema from "./schema";

/**
 * 全マイグレーションを適用したインメモリDBを作成する。
 *
 * @returns テスト用のDBとクライアント。
 */
async function createTestDatabase() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  return { client, db };
}

describe("daily recommendation schema", () => {
  it("推薦バッチから3距離帯の店舗まで保存できる", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await db.insert(schema.user).values({
        id: "user-1",
        name: "Test User",
        email: "user-1@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const [preference] = await db
        .insert(schema.userPreferences)
        .values({
          userId: "user-1",
          campusAddress: "東京都千代田区千代田1-1",
        })
        .returning();
      const [batch] = await db
        .insert(schema.recommendationBatches)
        .values({ userId: "user-1", targetDate: "2026-08-08" })
        .returning();
      const [category] = await db
        .insert(schema.recommendationCategories)
        .values({ batchId: batch.id, category: "和食", selectionOrder: 1 })
        .returning();
      const [restaurant] = await db
        .insert(schema.restaurants)
        .values({
          googlePlaceId: "google-place-1",
          name: "テスト食堂",
          address: "東京都千代田区丸の内1-1",
          latitude: 35.681236,
          longitude: 139.767125,
        })
        .returning();
      const [recommendation] = await db
        .insert(schema.recommendations)
        .values({
          batchId: batch.id,
          recommendationCategoryId: category.id,
          restaurantId: restaurant.id,
          distanceGroup: "near",
          distanceMeters: 320,
          displayOrder: 1,
        })
        .returning();

      expect(preference.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(batch.status).toBe("pending");
      expect(recommendation).toMatchObject({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: "near",
      });
    } finally {
      client.close();
    }
  });

  it("同じユーザーと対象日の推薦バッチを重複登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await db.insert(schema.user).values({
        id: "user-2",
        name: "Test User",
        email: "user-2@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db
        .insert(schema.recommendationBatches)
        .values({ userId: "user-2", targetDate: "2026-08-08" });

      await expect(
        db
          .insert(schema.recommendationBatches)
          .values({ userId: "user-2", targetDate: "2026-08-08" }),
      ).rejects.toThrow();
    } finally {
      client.close();
    }
  });

  it("カテゴリの選択順を1から3に制限する", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await db.insert(schema.user).values({
        id: "user-3",
        name: "Test User",
        email: "user-3@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const [batch] = await db
        .insert(schema.recommendationBatches)
        .values({ userId: "user-3", targetDate: "2026-08-08" })
        .returning();

      await expect(
        db.insert(schema.recommendationCategories).values({
          batchId: batch.id,
          category: "ラーメン",
          selectionOrder: 4,
        }),
      ).rejects.toThrow();
    } finally {
      client.close();
    }
  });
});
