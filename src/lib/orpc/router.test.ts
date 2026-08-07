// oRPCルーターの認証と日次推薦一覧のレスポンスを検証する。
// インメモリSQLiteを使い、Repositoryまで含むAPIの結合動作を確認する。

import { createClient } from "@libsql/client";
import { createRouterClient } from "@orpc/server";
import { drizzle } from "drizzle-orm/libsql";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema";
import { formatRecommendationTargetDate } from "../recommendations/service";
import type { ORPCContext } from "./context";
import { router } from "./router";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const unauthContext: ORPCContext = { db, session: null };

/**
 * APIテストに必要なテーブルを初期状態で作成する。
 *
 * @returns なし
 */
async function recreateTables(): Promise<void> {
  await db.run("PRAGMA foreign_keys = OFF");
  await db.run("DROP TABLE IF EXISTS recommendations");
  await db.run("DROP TABLE IF EXISTS recommendation_categories");
  await db.run("DROP TABLE IF EXISTS recommendation_batches");
  await db.run("DROP TABLE IF EXISTS restaurants");
  await db.run("DROP TABLE IF EXISTS user");
  await db.run(
    "CREATE TABLE user (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified integer NOT NULL, image text, created_at integer NOT NULL, updated_at integer NOT NULL)",
  );
  await db.run(
    "CREATE TABLE recommendation_batches (id text PRIMARY KEY, user_id text NOT NULL, target_date text NOT NULL, status text NOT NULL, started_at integer, completed_at integer, created_at integer NOT NULL DEFAULT (unixepoch()))",
  );
  await db.run(
    "CREATE TABLE recommendation_categories (id text PRIMARY KEY, batch_id text NOT NULL, category text NOT NULL, selection_order integer NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch()))",
  );
  await db.run(
    "CREATE TABLE restaurants (id text PRIMARY KEY, google_place_id text NOT NULL UNIQUE, name text NOT NULL, address text NOT NULL, latitude real NOT NULL, longitude real NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch()), updated_at integer NOT NULL DEFAULT (unixepoch()))",
  );
  await db.run(
    "CREATE TABLE recommendations (id text PRIMARY KEY, batch_id text NOT NULL, recommendation_category_id text NOT NULL, restaurant_id text NOT NULL, distance_group text NOT NULL, distance_meters integer NOT NULL, display_order integer NOT NULL, created_at integer NOT NULL DEFAULT (unixepoch()))",
  );
}

/**
 * 認証済みユーザーのoRPCコンテキストを作成する。
 *
 * @param userId - テストで使用するユーザーID
 * @returns 認証済みoRPCコンテキスト
 */
async function createAuthContext(
  userId = "test-user-id",
): Promise<ORPCContext> {
  await db.insert(schema.user).values({
    id: userId,
    name: "Test User",
    email: `${userId}@example.com`,
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    db,
    session: { user: { id: userId } } as ORPCContext["session"],
  };
}

/**
 * 未認証状態のoRPCクライアントを作成する。
 *
 * @returns 未認証oRPCクライアント
 */
function createUnauthedClient() {
  return createRouterClient(router, { context: unauthContext });
}

/**
 * 認証済み状態のoRPCクライアントを作成する。
 *
 * @param userId - テストで使用するユーザーID
 * @returns 認証済みoRPCクライアント
 */
async function createAuthedClient(userId = "test-user-id") {
  return createRouterClient(router, {
    context: await createAuthContext(userId),
  });
}

describe("router", () => {
  beforeEach(async () => {
    await recreateTables();
  });

  it("returns the health status without authentication", async () => {
    await expect(createUnauthedClient().health()).resolves.toEqual({
      ok: true,
    });
  });

  it("rejects daily recommendations without authentication", async () => {
    await expect(
      createUnauthedClient().recommendation.listToday(),
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns today's completed recommendations in display order", async () => {
    const userId = "recommendation-user";
    const rpcClient = await createAuthedClient(userId);
    const targetDate = formatRecommendationTargetDate(new Date());

    await db.insert(schema.recommendationBatches).values({
      id: "batch-1",
      userId,
      targetDate,
      status: "completed",
    });
    await db.insert(schema.recommendationCategories).values({
      id: "category-1",
      batchId: "batch-1",
      category: "ラーメン",
      selectionOrder: 1,
    });
    await db.insert(schema.restaurants).values([
      {
        id: "restaurant-near",
        googlePlaceId: "place-near",
        name: "近くのラーメン店",
        address: "東京都千代田区1-1",
        latitude: 35.68,
        longitude: 139.76,
      },
      {
        id: "restaurant-middle",
        googlePlaceId: "place-middle",
        name: "中距離のラーメン店",
        address: "東京都千代田区1-2",
        latitude: 35.681,
        longitude: 139.761,
      },
    ]);
    await db.insert(schema.recommendations).values([
      {
        id: "recommendation-middle",
        batchId: "batch-1",
        recommendationCategoryId: "category-1",
        restaurantId: "restaurant-middle",
        distanceGroup: "middle",
        distanceMeters: 500,
        displayOrder: 2,
      },
      {
        id: "recommendation-near",
        batchId: "batch-1",
        recommendationCategoryId: "category-1",
        restaurantId: "restaurant-near",
        distanceGroup: "near",
        distanceMeters: 250,
        displayOrder: 1,
      },
    ]);

    const result = await rpcClient.recommendation.listToday();

    expect(result.map((item) => item.recommendationId)).toEqual([
      "recommendation-near",
      "recommendation-middle",
    ]);
    expect(result[0]).toMatchObject({
      category: "ラーメン",
      restaurantName: "近くのラーメン店",
      distanceGroup: "near",
      distanceMeters: 250,
    });
  });

  it("does not return pending or another user's recommendations", async () => {
    const rpcClient = await createAuthedClient("current-user");
    const targetDate = formatRecommendationTargetDate(new Date());

    await db.insert(schema.recommendationBatches).values([
      {
        id: "pending-batch",
        userId: "current-user",
        targetDate,
        status: "pending",
      },
      {
        id: "other-user-batch",
        userId: "other-user",
        targetDate,
        status: "completed",
      },
    ]);

    await expect(rpcClient.recommendation.listToday()).resolves.toEqual([]);
  });
});
