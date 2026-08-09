/**
 * フロントエンド開発で利用できる日次推薦APIのデモデータを生成する。
 * 本番レスポンスと同じZodスキーマで検証し、API契約とのずれを防ぐ。
 */

import { DISTANCE_GROUPS } from "@/constants/constants";
import {
  LUNCH_RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_CATEGORY_COUNT,
} from "@/constants/recommendationGeneration";
import { formatJapanDate } from "../japanDate";
import {
  type GenerateRecommendationsOutput,
  GenerateRecommendationsOutputSchema,
} from "./schemas";

const MOCK_CATEGORIES = LUNCH_RECOMMENDATION_CATEGORIES.slice(
  0,
  RECOMMENDATION_CATEGORY_COUNT,
);

/**
 * 3カテゴリ×3店舗の日次推薦デモデータを生成する。
 *
 * @param targetDate - YYYY-MM-DD形式の対象日。
 * @returns APIレスポンススキーマで検証済みのデモデータ。
 */
export function createDailyRecommendationMock(
  targetDate = formatJapanDate(new Date()),
): GenerateRecommendationsOutput {
  return GenerateRecommendationsOutputSchema.parse({
    batchId: `demo-batch-${targetDate}`,
    targetDate,
    status: "completed",
    categories: MOCK_CATEGORIES.map((category, categoryIndex) => ({
      id: `demo-category-${categoryIndex + 1}`,
      category,
      recommendations: DISTANCE_GROUPS.map((distanceGroup, distanceIndex) => ({
        id: `demo-recommendation-${categoryIndex + 1}-${distanceIndex + 1}`,
        distanceGroup,
        distanceMeters: 180 + distanceIndex * 240 + categoryIndex * 10,
        campusToRestaurantSeconds:
          135 + distanceIndex * 180 + categoryIndex * 15,
        restaurant: {
          id: `demo-restaurant-${categoryIndex + 1}-${distanceIndex + 1}`,
          googlePlaceId: `demo-place-${categoryIndex + 1}-${distanceIndex + 1}`,
          name: `${category}デモ店舗${distanceIndex + 1}`,
          address: `東京都千代田区デモ${categoryIndex + 1}-${distanceIndex + 1}`,
          latitude: 35.681236 + categoryIndex * 0.001,
          longitude: 139.767125 + distanceIndex * 0.001,
          priceRange: {
            currencyCode: "JPY",
            startPrice: 800 + categoryIndex * 100,
            endPrice: 1200 + distanceIndex * 200,
          },
        },
      })),
    })),
  });
}

/** フロントエンドがそのままimportできる既定の日次推薦デモデータ。 */
export const DAILY_RECOMMENDATION_MOCK = createDailyRecommendationMock();
