/**
 * 推薦APIと推薦生成処理で共有するZodスキーマを定義する。
 * APIの入力・出力とGoogle Placesレスポンスを実行時に検証する。
 */

import { z } from "zod";
import {
  LUNCH_RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_CATEGORY_COUNT,
  RECOMMENDATIONS_PER_CATEGORY,
} from "@/constants/recommendationGeneration";
import { DISTANCE_GROUPS } from "@/constants/recommendationSchema";

/** 推薦生成APIの入力。日付を省略した場合は日本時間の当日を使用する。 */
export const GenerateRecommendationsInputSchema = z.object({
  targetDate: z.iso.date().optional(),
});

/** 推薦APIが返す料金レンジ。 */
export const RecommendationPriceRangeSchema = z.object({
  currencyCode: z.string().length(3),
  startPrice: z.number().int().nonnegative(),
  endPrice: z.number().int().positive().nullable(),
});

/** 推薦APIが返す店舗情報。 */
export const RecommendationRestaurantSchema = z.object({
  id: z.string().min(1),
  googlePlaceId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  priceRange: RecommendationPriceRangeSchema.nullable(),
});

/** 推薦APIが返す店舗1件。 */
export const RecommendationResultSchema = z.object({
  id: z.string().min(1),
  distanceGroup: z.enum(DISTANCE_GROUPS),
  distanceMeters: z.number().int().nonnegative(),
  campusToRestaurantSeconds: z.number().int().nonnegative(),
  restaurant: RecommendationRestaurantSchema,
});

/** 推薦APIが返すカテゴリ1件と3距離帯の店舗。 */
export const RecommendationCategoryResultSchema = z.object({
  id: z.string().min(1),
  category: z.enum(LUNCH_RECOMMENDATION_CATEGORIES),
  recommendations: z
    .array(RecommendationResultSchema)
    .length(RECOMMENDATIONS_PER_CATEGORY),
});

/** 推薦生成APIの正常レスポンス。 */
export const GenerateRecommendationsOutputSchema = z.object({
  batchId: z.string().min(1),
  targetDate: z.iso.date(),
  status: z.literal("completed"),
  categories: z
    .array(RecommendationCategoryResultSchema)
    .length(RECOMMENDATION_CATEGORY_COUNT),
});

/** 推薦生成APIの入力型。 */
export type GenerateRecommendationsInput = z.infer<
  typeof GenerateRecommendationsInputSchema
>;

/** 推薦生成APIの正常レスポンス型。 */
export type GenerateRecommendationsOutput = z.infer<
  typeof GenerateRecommendationsOutputSchema
>;
