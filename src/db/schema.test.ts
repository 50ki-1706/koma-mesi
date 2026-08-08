/**
 * 日次飲食店推薦スキーマと生成マイグレーションの統合テストを行う。
 * テーブル間の保存経路と主要なDB制約がSQLiteで機能することを検証する。
 */
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
    .values({ batchId: batch.id, category: "和食" })
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
  let client: ReturnType<typeof createClient> | undefined;
  let db: TestDatabase;

  beforeEach(async () => {
    const testDatabase = await createTestDatabase();
    client = testDatabase.client;
    db = testDatabase.db;
  });

  afterEach(() => {
    client?.close();
    client = undefined;
  });

  it("許可されていない推薦バッチ状態を登録できない", async () => {
    await insertTestUser(db, "user-invalid-status");

    await expectDatabaseError(
      db.insert(schema.recommendationBatches).values({
        userId: "user-invalid-status",
        targetDate: "2026-08-08",
        status: sql`${"invalid-status"}`,
      }),
      /CHECK constraint failed: recommendation_batches_status_check/,
    );
  });

  it("許可されていない推薦カテゴリを登録できない", async () => {
    await insertTestUser(db, "user-invalid-category");
    const [batch] = await db
      .insert(schema.recommendationBatches)
      .values({ userId: "user-invalid-category", targetDate: "2026-08-08" })
      .returning();

    await expectDatabaseError(
      db.insert(schema.recommendationCategories).values({
        batchId: batch.id,
        category: sql`${"対象外カテゴリ"}`,
      }),
      /CHECK constraint failed: recommendation_categories_category_check/,
    );
  });

  it("許可されていない距離グループを登録できない", async () => {
    const { batch, category, restaurant } =
      await seedRecommendationDependencies(db, "user-invalid-distance-group");

    await expectDatabaseError(
      db.insert(schema.recommendations).values({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: sql`${"invalid-distance-group"}`,
        distanceMeters: 320,
      }),
      /CHECK constraint failed: recommendations_distance_group_check/,
    );
  });

  it("推薦バッチから3距離帯の店舗まで保存できる", async () => {
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
  });

  it("同じユーザーと対象日の推薦バッチを重複登録できない", async () => {
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
  });

  it("ゼロ埋めされていない対象日を登録できない", async () => {
    await insertTestUser(db, "user-invalid-target-date");

    await expectDatabaseError(
      db.insert(schema.recommendationBatches).values({
        userId: "user-invalid-target-date",
        targetDate: "2026-8-8",
      }),
      /CHECK constraint failed: recommendation_batches_target_date_check/,
    );
  });

  it("負の距離を登録できない", async () => {
    const { batch, category, restaurant } =
      await seedRecommendationDependencies(db, "user-distance");

    await expectDatabaseError(
      db.insert(schema.recommendations).values({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: "near",
        distanceMeters: -1,
      }),
      /CHECK constraint failed: recommendations_distance_meters_check/,
    );
  });

  it("同じカテゴリに同じ距離帯を重複登録できない", async () => {
    const { batch, category, restaurant } =
      await seedRecommendationDependencies(db, "user-distance-group");
    await db.insert(schema.recommendations).values({
      batchId: batch.id,
      recommendationCategoryId: category.id,
      restaurantId: restaurant.id,
      distanceGroup: "near",
      distanceMeters: 320,
    });

    await expectDatabaseError(
      db.insert(schema.recommendations).values({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: "near",
        distanceMeters: 400,
      }),
      /UNIQUE constraint failed: recommendations\.recommendation_category_id, recommendations\.distance_group/,
    );
  });

  it("同じカテゴリに同じ店舗を重複登録できない", async () => {
    const { batch, category, restaurant } =
      await seedRecommendationDependencies(db, "user-restaurant");
    await db.insert(schema.recommendations).values({
      batchId: batch.id,
      recommendationCategoryId: category.id,
      restaurantId: restaurant.id,
      distanceGroup: "near",
      distanceMeters: 320,
    });

    await expectDatabaseError(
      db.insert(schema.recommendations).values({
        batchId: batch.id,
        recommendationCategoryId: category.id,
        restaurantId: restaurant.id,
        distanceGroup: "middle",
        distanceMeters: 1_200,
      }),
      /UNIQUE constraint failed: recommendations\.recommendation_category_id, recommendations\.restaurant_id/,
    );
  });

  it("Google Place IDを重複登録できない", async () => {
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
  });

  it("同じ店舗に複数の商品画像URLを保存できる", async () => {
    const { restaurant } = await seedRecommendationDependencies(
      db,
      "user-photos",
    );

    const photos = await db
      .insert(schema.restaurantPhotos)
      .values([
        {
          restaurantId: restaurant.id,
          photoUrl: "https://example.com/restaurant/photo-1.jpg",
        },
        {
          restaurantId: restaurant.id,
          photoUrl: "https://example.com/restaurant/photo-2.jpg",
        },
      ])
      .returning();

    expect(photos).toHaveLength(2);
    expect(photos.map((photo) => photo.photoUrl)).toEqual([
      "https://example.com/restaurant/photo-1.jpg",
      "https://example.com/restaurant/photo-2.jpg",
    ]);
  });

  it("同じ店舗に同じ商品画像URLを重複保存できない", async () => {
    const { restaurant } = await seedRecommendationDependencies(
      db,
      "user-duplicate-photo",
    );
    const photoUrl = "https://example.com/restaurant/photo.jpg";
    await db.insert(schema.restaurantPhotos).values({
      restaurantId: restaurant.id,
      photoUrl,
    });

    await expectDatabaseError(
      db.insert(schema.restaurantPhotos).values({
        restaurantId: restaurant.id,
        photoUrl,
      }),
      /UNIQUE constraint failed: restaurant_photos\.restaurant_id, restaurant_photos\.photo_url/,
    );
  });

  it("店舗の料金レンジを保存できる", async () => {
    const { restaurant } = await seedRecommendationDependencies(
      db,
      "user-price-range",
    );

    const [priceRange] = await db
      .insert(schema.restaurantPriceRanges)
      .values({
        restaurantId: restaurant.id,
        currencyCode: "JPY",
        startPrice: 1_000,
        endPrice: 3_000,
      })
      .returning();

    expect(priceRange).toMatchObject({
      restaurantId: restaurant.id,
      currencyCode: "JPY",
      startPrice: 1_000,
      endPrice: 3_000,
    });
  });

  it("同じ店舗に料金レンジを重複保存できない", async () => {
    const { restaurant } = await seedRecommendationDependencies(
      db,
      "user-duplicate-price-range",
    );
    await db.insert(schema.restaurantPriceRanges).values({
      restaurantId: restaurant.id,
      currencyCode: "JPY",
      startPrice: 1_000,
      endPrice: 3_000,
    });

    await expectDatabaseError(
      db.insert(schema.restaurantPriceRanges).values({
        restaurantId: restaurant.id,
        currencyCode: "JPY",
        startPrice: 3_000,
        endPrice: 5_000,
      }),
      /UNIQUE constraint failed: restaurant_price_ranges\.restaurant_id/,
    );
  });

  it("同じユーザーに設定を重複登録できない", async () => {
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
  });

  it.each([
    { campusLatitude: -90, campusLongitude: -180 },
    { campusLatitude: 35.681236, campusLongitude: 139.767125 },
    { campusLatitude: 90, campusLongitude: 180 },
  ])(
    "有効なキャンパス座標ペアを保存できる: $campusLatitude, $campusLongitude",
    async ({ campusLatitude, campusLongitude }) => {
      const userId = `user-coordinates-${campusLatitude}-${campusLongitude}`;
      await insertTestUser(db, userId);

      const [preference] = await db
        .insert(schema.userPreferences)
        .values({
          userId,
          campusAddress: "東京都千代田区千代田1-1",
          campusLatitude,
          campusLongitude,
        })
        .returning();

      expect(preference).toMatchObject({
        campusLatitude,
        campusLongitude,
      });
    },
  );

  it.each([
    { campusLatitude: 35.681236, campusLongitude: null },
    { campusLatitude: null, campusLongitude: 139.767125 },
    { campusLatitude: -90.000001, campusLongitude: 139.767125 },
    { campusLatitude: 90.000001, campusLongitude: 139.767125 },
    { campusLatitude: 35.681236, campusLongitude: -180.000001 },
    { campusLatitude: 35.681236, campusLongitude: 180.000001 },
  ])(
    "不完全または範囲外のキャンパス座標を保存できない: $campusLatitude, $campusLongitude",
    async ({ campusLatitude, campusLongitude }) => {
      const userId = `user-invalid-coordinates-${campusLatitude}-${campusLongitude}`;
      await insertTestUser(db, userId);

      await expectDatabaseError(
        db.insert(schema.userPreferences).values({
          userId,
          campusAddress: "東京都千代田区千代田1-1",
          campusLatitude,
          campusLongitude,
        }),
        /CHECK constraint failed: user_preferences_campus_coordinates_check/,
      );
    },
  );

  it("存在しないバッチにカテゴリを登録できない", async () => {
    await expectDatabaseError(
      db.insert(schema.recommendationCategories).values({
        batchId: "missing-batch-id",
        category: "ラーメン",
      }),
      /FOREIGN KEY constraint failed/,
    );
  });
});
