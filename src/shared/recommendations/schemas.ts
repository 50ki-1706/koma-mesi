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
import { isAllowedRecommendationTargetDate } from "../japanDate";

/** 推薦生成APIの入力。日付を省略した場合は日本時間の当日を使用する。 */
export const GenerateRecommendationsInputSchema = z.object({
  targetDate: z.iso
    .date()
    .refine(isAllowedRecommendationTargetDate, {
      error: "対象日は日本時間の当日または翌日のみ指定できます。",
    })
    .optional(),
});

/** 保存済み推薦取得APIの入力。日付を省略した場合は日本時間の当日を使用する。 */
export const GetRecommendationsInputSchema = z.object({
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

/** 保存済み推薦取得APIのレスポンス。未生成の場合はnullを返す。 */
export const GetRecommendationsOutputSchema =
  GenerateRecommendationsOutputSchema.nullable();

/** 日次Cronが返すユーザーごとの処理件数。 */
export const DailyRecommendationCronOutputSchema = z.object({
  targetDate: z.iso.date(),
  totalUsers: z.number().int().nonnegative(),
  completedUsers: z.number().int().nonnegative(),
  skippedUsers: z.number().int().nonnegative(),
  failedUsers: z.number().int().nonnegative(),
});

/** 推薦生成APIの入力型。 */
export type GenerateRecommendationsInput = z.infer<
  typeof GenerateRecommendationsInputSchema
>;

/** 推薦生成APIの正常レスポンス型。 */
export type GenerateRecommendationsOutput = z.infer<
  typeof GenerateRecommendationsOutputSchema
>;

/** 保存済み推薦取得APIの入力型。 */
export type GetRecommendationsInput = z.infer<
  typeof GetRecommendationsInputSchema
>;

/** 保存済み推薦取得APIのレスポンス型。 */
export type GetRecommendationsOutput = z.infer<
  typeof GetRecommendationsOutputSchema
>;

/** 日次Cronの実行結果型。 */
export type DailyRecommendationCronOutput = z.infer<
  typeof DailyRecommendationCronOutputSchema
>;
