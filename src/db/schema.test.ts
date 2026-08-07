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
 * 全マイグレーションを適用したインメモリSQLiteのテスト用DBを作成する。
 *
 * @returns `client`はテスト終了時のclose処理に使うLibSQLクライアント、`db`はテスト対象を操作するDrizzleインスタンス。
 */
async function createTestDatabase() {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");

  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  return { client, db };
}

/** テスト用DBの型。 */
type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>["db"];

/**
 * 制約テストで使用するユーザーを登録する。
 *
 * @param db - テスト用DB。
 * @param userId - 登録するユーザーID。
 * @returns 登録完了時に解決するPromise。
 */
async function insertTestUser(db: TestDatabase, userId: string): Promise<void> {
  await db.insert(schema.user).values({
    id: userId,
    name: "Test User",
    email: `${userId}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * 推薦レコードの制約テストに必要な関連レコードを登録する。
 *
 * @param db - テスト用DB。
 * @param userId - 関連レコードを所有するユーザーID。
 * @returns `batch`は推薦処理単位、`category`はそのバッチに属する推薦カテゴリ、`restaurant`は推薦対象の店舗。
 */
async function seedRecommendationDependencies(
  db: TestDatabase,
  userId: string,
) {
  await insertTestUser(db, userId);

  const [batch] = await db
    .insert(schema.recommendationBatches)
    .values({ userId, targetDate: "2026-08-08" })
    .returning();
  const [category] = await db
    .insert(schema.recommendationCategories)
    .values({ batchId: batch.id, category: "和食", selectionOrder: 1 })
    .returning();
  const [restaurant] = await db
    .insert(schema.restaurants)
    .values({
      googlePlaceId: `${userId}-google-place`,
      name: "テスト食堂",
      address: "東京都千代田区丸の内1-1",
      latitude: 35.681236,
      longitude: 139.767125,
    })
    .returning();

  return { batch, category, restaurant };
}

/**
 * DrizzleがラップしたDBエラーの原因メッセージを検査する。
 *
 * @param operation - 制約違反が発生するDB操作。
 * @param expectedMessage - DBエラー原因に期待するメッセージ。
 * @returns 検査完了時に解決するPromise。
 */
async function expectDatabaseError(
  operation: PromiseLike<unknown>,
  expectedMessage: RegExp,
): Promise<void> {
  let thrownError: unknown;

  try {
    await operation;
  } catch (error: unknown) {
    thrownError = error;
  }

  expect(thrownError).toBeInstanceOf(Error);
  if (!(thrownError instanceof Error)) {
    throw new TypeError("Expected the database operation to throw an Error");
  }

  expect(thrownError.cause).toBeInstanceOf(Error);
  if (!(thrownError.cause instanceof Error)) {
    throw new TypeError(
      "Expected the database error to include an Error cause",
    );
  }

  expect(thrownError.cause.message).toMatch(expectedMessage);
}

describe("daily recommendation schema", () => {
  it("推薦バッチから3距離帯の店舗まで保存できる", async () => {
    const { client, db } = await createTestDatabase();

    try {
      const { batch, category, restaurant } =
        await seedRecommendationDependencies(db, "user-1");
      const [preference] = await db
        .insert(schema.userPreferences)
        .values({
          userId: "user-1",
          campusAddress: "東京都千代田区千代田1-1",
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
      await insertTestUser(db, "user-2");
      await db
        .insert(schema.recommendationBatches)
        .values({ userId: "user-2", targetDate: "2026-08-08" });

      await expectDatabaseError(
        db
          .insert(schema.recommendationBatches)
          .values({ userId: "user-2", targetDate: "2026-08-08" }),
        /UNIQUE constraint failed: recommendation_batches\.user_id, recommendation_batches\.target_date/,
      );
    } finally {
      client.close();
    }
  });

  it("カテゴリの選択順を1から3に制限する", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await insertTestUser(db, "user-3");
      const [batch] = await db
        .insert(schema.recommendationBatches)
        .values({ userId: "user-3", targetDate: "2026-08-08" })
        .returning();

      await expectDatabaseError(
        db.insert(schema.recommendationCategories).values({
          batchId: batch.id,
          category: "ラーメン",
          selectionOrder: 4,
        }),
        /CHECK constraint failed: recommendation_categories_selection_order_check/,
      );
    } finally {
      client.close();
    }
  });

  it("負の距離を登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      const { batch, category, restaurant } =
        await seedRecommendationDependencies(db, "user-distance");

      await expectDatabaseError(
        db.insert(schema.recommendations).values({
          batchId: batch.id,
          recommendationCategoryId: category.id,
          restaurantId: restaurant.id,
          distanceGroup: "near",
          distanceMeters: -1,
          displayOrder: 1,
        }),
        /CHECK constraint failed: recommendations_distance_meters_check/,
      );
    } finally {
      client.close();
    }
  });

  it.each([0, 4])("表示順に%dを登録できない", async (displayOrder) => {
    const { client, db } = await createTestDatabase();

    try {
      const { batch, category, restaurant } =
        await seedRecommendationDependencies(db, `user-order-${displayOrder}`);

      await expectDatabaseError(
        db.insert(schema.recommendations).values({
          batchId: batch.id,
          recommendationCategoryId: category.id,
          restaurantId: restaurant.id,
          distanceGroup: "near",
          distanceMeters: 320,
          displayOrder,
        }),
        /CHECK constraint failed: recommendations_display_order_check/,
      );
    } finally {
      client.close();
    }
  });

  it("同じカテゴリに同じ距離帯を重複登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      const { batch, category, restaurant } =
        await seedRecommendationDependencies(db, "user-distance-group");
      await db.insert(schema.recommendations).values({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: "near",
        distanceMeters: 320,
        displayOrder: 1,
      });

      await expectDatabaseError(
        db.insert(schema.recommendations).values({
          batchId: batch.id,
          recommendationCategoryId: category.id,
          restaurantId: restaurant.id,
          distanceGroup: "near",
          distanceMeters: 400,
          displayOrder: 2,
        }),
        /UNIQUE constraint failed: recommendations\.recommendation_category_id, recommendations\.distance_group/,
      );
    } finally {
      client.close();
    }
  });

  it("Google Place IDを重複登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      const { restaurant } = await seedRecommendationDependencies(
        db,
        "user-google-place",
      );

      await expectDatabaseError(
        db.insert(schema.restaurants).values({
          googlePlaceId: restaurant.googlePlaceId,
          name: "重複店舗",
          address: "東京都千代田区丸の内2-2",
          latitude: 35.68,
          longitude: 139.76,
        }),
        /UNIQUE constraint failed: restaurants\.google_place_id/,
      );
    } finally {
      client.close();
    }
  });

  it("同じユーザーに設定を重複登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await insertTestUser(db, "user-preference");
      await db.insert(schema.userPreferences).values({
        userId: "user-preference",
        campusAddress: "東京都千代田区千代田1-1",
      });

      await expectDatabaseError(
        db.insert(schema.userPreferences).values({
          userId: "user-preference",
          campusAddress: "東京都新宿区西新宿2-8-1",
        }),
        /UNIQUE constraint failed: user_preferences\.user_id/,
      );
    } finally {
      client.close();
    }
  });

  it("存在しないバッチにカテゴリを登録できない", async () => {
    const { client, db } = await createTestDatabase();

    try {
      await expectDatabaseError(
        db.insert(schema.recommendationCategories).values({
          batchId: "missing-batch-id",
          category: "ラーメン",
          selectionOrder: 1,
        }),
        /FOREIGN KEY constraint failed/,
      );
    } finally {
      client.close();
    }
  });
});
