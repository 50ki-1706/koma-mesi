// 推薦ドメインの Drizzle スキーマが設計上の制約を公開していることを検証する。
// 実DBへ適用される一意制約・CHECK 制約・外部キーの退行を防ぐ。

import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";
import {
  recommendationBatches,
  recommendationCategories,
  recommendations,
  restaurants,
  userPreferences,
} from "./schema";

/**
 * テーブルに定義されたインデックス名を取得する。
 *
 * @param tableConfig - Drizzle が公開するテーブル設定
 * @returns インデックス名の配列
 */
function indexNames(tableConfig: ReturnType<typeof getTableConfig>): string[] {
  return tableConfig.indexes.map((index) => index.config.name);
}

/**
 * テーブルに定義された CHECK 制約名を取得する。
 *
 * @param tableConfig - Drizzle が公開するテーブル設定
 * @returns CHECK 制約名の配列
 */
function checkNames(tableConfig: ReturnType<typeof getTableConfig>): string[] {
  return tableConfig.checks.map((constraint) => constraint.name);
}

describe("recommendation schema", () => {
  it("keeps one preference row per user", () => {
    const config = getTableConfig(userPreferences);
    const userId = config.columns.find((column) => column.name === "user_id");

    expect(userId?.isUnique).toBe(true);
    expect(config.foreignKeys).toHaveLength(1);
    expect(config.foreignKeys[0].onDelete).toBe("cascade");
  });

  it("keeps one batch per user and target date", () => {
    const config = getTableConfig(recommendationBatches);

    expect(indexNames(config)).toContain(
      "recommendation_batches_user_id_target_date_unique",
    );
    expect(checkNames(config)).toContain("recommendation_batches_status_check");
    expect(recommendationBatches.status.enumValues).toEqual([
      "pending",
      "processing",
      "completed",
      "failed",
    ]);
  });

  it("limits each batch to distinct category slots", () => {
    const config = getTableConfig(recommendationCategories);

    expect(indexNames(config)).toEqual(
      expect.arrayContaining([
        "recommendation_categories_batch_id_category_unique",
        "recommendation_categories_batch_id_selection_order_unique",
      ]),
    );
    expect(checkNames(config)).toContain(
      "recommendation_categories_selection_order_check",
    );
  });

  it("keeps one recommendation per category and distance group", () => {
    const config = getTableConfig(recommendations);

    expect(indexNames(config)).toEqual(
      expect.arrayContaining([
        "recommendations_category_id_distance_group_unique",
        "recommendations_category_id_display_order_unique",
        "recommendations_category_id_restaurant_id_unique",
      ]),
    );
    expect(checkNames(config)).toEqual(
      expect.arrayContaining([
        "recommendations_distance_group_check",
        "recommendations_distance_meters_check",
        "recommendations_display_order_check",
      ]),
    );
    expect(recommendations.distanceGroup.enumValues).toEqual([
      "near",
      "middle",
      "far",
    ]);
    expect(config.foreignKeys).toHaveLength(2);
  });

  it("validates restaurant coordinates and Google Place identity", () => {
    const config = getTableConfig(restaurants);
    const googlePlaceId = config.columns.find(
      (column) => column.name === "google_place_id",
    );

    expect(googlePlaceId?.isUnique).toBe(true);
    expect(checkNames(config)).toEqual(
      expect.arrayContaining([
        "restaurants_latitude_check",
        "restaurants_longitude_check",
      ]),
    );
  });
});
