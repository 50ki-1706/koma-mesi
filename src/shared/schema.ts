/**
 * アプリケーション全体で共有するZodスキーマを単一エントリポイントに集約する。
 * 推薦API・初期設定・ヘルスチェックの入出力を実行時に検証する。
 */

import { z } from "zod";
import { DISTANCE_GROUPS, WEEKDAYS } from "@/constants/constants";
import {
  LUNCH_RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_CATEGORY_COUNT,
  RECOMMENDATIONS_PER_CATEGORY,
} from "@/constants/recommendationGeneration";
import { isAllowedRecommendationTargetDate } from "./japanDate";

const weekdayValues = WEEKDAYS.map(({ value }) => value) as [
  (typeof WEEKDAYS)[number]["value"],
  ...(typeof WEEKDAYS)[number]["value"][],
];

/** Validates a time in bounded, zero-padded 24-hour HH:MM notation. */
const boundedTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

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

/** Validates and normalizes the input required to complete initial setup. */
export const initialSetupInputSchema = z
  .object({
    postalCode: z.string().trim().min(1),
    prefecture: z.string().trim().min(1),
    streetAddress: z.string().trim().min(1),
    lunchStartTime: boundedTimeSchema,
    lunchEndTime: boundedTimeSchema,
    lunchDays: z
      .enum(weekdayValues)
      .array()
      .min(1, "At least one day is required")
      .transform((days) =>
        [...new Set(days)].sort(
          (a, b) =>
            WEEKDAYS.findIndex((w) => w.value === a) -
            WEEKDAYS.findIndex((w) => w.value === b),
        ),
      ),
  })
  .refine(({ lunchStartTime, lunchEndTime }) => lunchStartTime < lunchEndTime, {
    error: "Lunch start time must be before lunch end time",
    path: ["lunchEndTime"],
  });

/** ヘルスチェックAPIのレスポンス。 */
export const healthOutputSchema = z.object({ ok: z.literal(true) });

/** 初期設定APIのステータスレスポンス。既知の大学座標を含む。 */
export const initialSetupStatusOutputSchema = z.object({
  isCompleted: z.boolean(),
  campusLocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .nullable(),
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

/** 初期設定APIの入力型。transform後の正規化済み曜日配列を含む。 */
export type InitialSetupInput = z.output<typeof initialSetupInputSchema>;

/** ヘルスチェックAPIのレスポンス型。 */
export type HealthOutput = z.infer<typeof healthOutputSchema>;

/** 初期設定ステータスAPIのレスポンス型。 */
export type InitialSetupStatusOutput = z.infer<
  typeof initialSetupStatusOutputSchema
>;
