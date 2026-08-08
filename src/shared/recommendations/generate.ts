/**
 * ユーザー1人分の日次推薦生成ユースケースを実行する。
 * バッチ状態、Google検索、既存店舗再利用、完了保存を調停する。
 */

import type { GooglePlacesGateway } from "./googlePlaces";
import type { RecommendationRepository } from "./repository";
import type { GenerateRecommendationsOutput } from "./schemas";
import { type RandomSource, selectDailyRecommendations } from "./selection";

const JAPAN_TIME_ZONE = "Asia/Tokyo";

/** 推薦生成の業務エラーコード。 */
export type RecommendationGenerationErrorCode =
  | "BATCH_ALREADY_EXISTS"
  | "CAMPUS_LOCATION_REQUIRED";

/** 推薦生成を開始できない業務条件を表すエラー。 */
export class RecommendationGenerationError extends Error {
  readonly code: RecommendationGenerationErrorCode;

  /**
   * 推薦生成エラーを生成する。
   *
   * @param code - APIエラーへ変換する識別子。
   * @param message - 利用者向けの説明。
   */
  constructor(code: RecommendationGenerationErrorCode, message: string) {
    super(message);
    this.name = "RecommendationGenerationError";
    this.code = code;
  }
}

/** 推薦生成ユースケースの依存関係。 */
export interface GenerateDailyRecommendationsDependencies {
  repository: RecommendationRepository;
  googlePlaces: GooglePlacesGateway;
  random?: RandomSource;
  now?: () => Date;
}

/** 推薦生成ユースケースへの入力。 */
export interface GenerateDailyRecommendationsCommand {
  userId: string;
  targetDate?: string;
}

/**
 * Dateを日本時間のYYYY-MM-DDへ変換する。
 *
 * @param date - 対象時刻。
 * @returns 日本時間の日付文字列。
 */
export function formatJapanDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

/**
 * ユーザー1人分の日次推薦を生成して保存する。
 *
 * @param dependencies - Repository、Google Places、乱数、現在時刻。
 * @param command - 対象ユーザーと任意の対象日。
 * @returns 保存済みの3カテゴリ×3店舗。
 */
export async function generateDailyRecommendations(
  dependencies: GenerateDailyRecommendationsDependencies,
  command: GenerateDailyRecommendationsCommand,
): Promise<GenerateRecommendationsOutput> {
  const targetDate =
    command.targetDate ?? formatJapanDate(dependencies.now?.() ?? new Date());
  const preference = await dependencies.repository.findUserPreference(
    command.userId,
  );
  if (preference === null) {
    throw new RecommendationGenerationError(
      "CAMPUS_LOCATION_REQUIRED",
      "大学の緯度経度を登録してください。",
    );
  }

  const existingBatch = await dependencies.repository.findBatch(
    command.userId,
    targetDate,
  );
  if (existingBatch !== null) {
    throw new RecommendationGenerationError(
      "BATCH_ALREADY_EXISTS",
      "対象日の推薦はすでに作成済み、または処理中です。",
    );
  }

  const batch = await dependencies.repository.createBatch(
    command.userId,
    targetDate,
  );

  try {
    await dependencies.repository.markBatchProcessing(batch.id);
    const selections = await selectDailyRecommendations(
      dependencies.googlePlaces,
      {
        latitude: preference.campusLatitude,
        longitude: preference.campusLongitude,
      },
      dependencies.random ?? Math.random,
    );
    const googlePlaceIds = selections.map(
      (selection) => selection.googlePlaceId,
    );
    const storedRestaurants =
      await dependencies.repository.findRestaurantsByGooglePlaceIds(
        googlePlaceIds,
      );
    const storedPlaceIds = new Set(
      storedRestaurants.map((restaurant) => restaurant.googlePlaceId),
    );
    const missingPlaceIds = googlePlaceIds.filter(
      (googlePlaceId) => !storedPlaceIds.has(googlePlaceId),
    );
    const newRestaurantDetails = await Promise.all(
      missingPlaceIds.map((googlePlaceId) =>
        dependencies.googlePlaces.getPlaceDetails(googlePlaceId),
      ),
    );

    return await dependencies.repository.completeBatch({
      batchId: batch.id,
      targetDate,
      selections,
      newRestaurantDetails,
    });
  } catch (error) {
    try {
      await dependencies.repository.markBatchFailed(batch.id);
    } catch {
      // 元の生成エラーを優先し、失敗状態への更新エラーで上書きしない。
    }
    throw error;
  }
}
