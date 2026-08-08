/**
 * 推薦生成処理が利用する永続化操作とDrizzle実装を定義する。
 * 外部API呼び出しとDBトランザクションを分離し、生成処理をテスト可能にする。
 */

import { and, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import type { LunchRecommendationCategory } from "@/constants/recommendationGeneration";
import type { db as applicationDb } from "@/db";
import * as schema from "@/db/schema";
import type {
  GenerateRecommendationsOutput,
  RecommendationPriceRangeSchema,
} from "@/shared/recommendations/schemas";
import type { DistanceGroup } from "@/shared/recommendations/selection";
import type { GooglePlaceDetails } from "./googlePlaces";

/** アプリケーションで使用するDrizzle DBクライアント。 */
export type RecommendationDatabase = typeof applicationDb;

/** 推薦生成対象となるユーザー設定。 */
export interface RecommendationUserPreference {
  campusLatitude: number;
  campusLongitude: number;
}

/** 日次推薦バッチの最小情報。 */
export interface RecommendationBatchRecord {
  id: string;
  status: (typeof schema.recommendationBatches.$inferSelect)["status"];
}

/** DBに保存済みの店舗と任意の料金レンジ。 */
export interface StoredRestaurant {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  priceRange: z.infer<typeof RecommendationPriceRangeSchema> | null;
}

/** DBへ保存する選出店舗。 */
export interface SelectedRestaurant {
  category: LunchRecommendationCategory;
  distanceGroup: DistanceGroup;
  googlePlaceId: string;
  distanceMeters: number;
  campusToRestaurantSeconds: number;
}

/** 完了バッチとして保存する全データ。 */
export interface CompleteRecommendationBatchInput {
  batchId: string;
  targetDate: string;
  selections: SelectedRestaurant[];
  newRestaurantDetails: GooglePlaceDetails[];
}

/** 推薦生成処理が利用する永続化境界。 */
export interface RecommendationRepository {
  /**
   * ユーザーの大学座標を取得する。
   *
   * @param userId - Better AuthのユーザーID。
   * @returns 完全な座標ペア。未登録ならnull。
   */
  findUserPreference(
    userId: string,
  ): Promise<RecommendationUserPreference | null>;

  /**
   * ユーザーと対象日の既存バッチを取得する。
   *
   * @param userId - Better AuthのユーザーID。
   * @param targetDate - YYYY-MM-DD形式の対象日。
   * @returns 既存バッチ。未作成ならnull。
   */
  findBatch(
    userId: string,
    targetDate: string,
  ): Promise<RecommendationBatchRecord | null>;

  /**
   * pending状態の日次推薦バッチを作成する。
   *
   * @param userId - Better AuthのユーザーID。
   * @param targetDate - YYYY-MM-DD形式の対象日。
   * @returns 作成したバッチ。
   */
  createBatch(
    userId: string,
    targetDate: string,
  ): Promise<RecommendationBatchRecord>;

  /**
   * バッチを処理中へ変更する。
   *
   * @param batchId - 推薦バッチID。
   * @returns なし。
   */
  markBatchProcessing(batchId: string): Promise<void>;

  /**
   * バッチを失敗へ変更する。
   *
   * @param batchId - 推薦バッチID。
   * @returns なし。
   */
  markBatchFailed(batchId: string): Promise<void>;

  /**
   * Google Place IDに一致する保存済み店舗を取得する。
   *
   * @param googlePlaceIds - 検索するGoogle Place ID一覧。
   * @returns 保存済み店舗一覧。
   */
  findRestaurantsByGooglePlaceIds(
    googlePlaceIds: readonly string[],
  ): Promise<StoredRestaurant[]>;

  /**
   * 選出結果をまとめて保存してバッチを完了する。
   *
   * @param input - バッチ、選出店舗、新規店舗詳細。
   * @returns APIへ返す保存済み推薦結果。
   */
  completeBatch(
    input: CompleteRecommendationBatchInput,
  ): Promise<GenerateRecommendationsOutput>;
}

/** Drizzleを利用した推薦Repository。 */
export class DrizzleRecommendationRepository
  implements RecommendationRepository
{
  private readonly database: RecommendationDatabase;

  /**
   * Drizzle Repositoryを生成する。
   *
   * @param database - Tursoへ接続されたDrizzleクライアント。
   */
  constructor(database: RecommendationDatabase) {
    this.database = database;
  }

  /**
   * ユーザーの大学座標を取得する。
   *
   * @param userId - Better AuthのユーザーID。
   * @returns 完全な座標ペア。未登録ならnull。
   */
  async findUserPreference(
    userId: string,
  ): Promise<RecommendationUserPreference | null> {
    const [preference] = await this.database
      .select({
        campusLatitude: schema.userPreferences.campusLatitude,
        campusLongitude: schema.userPreferences.campusLongitude,
      })
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, userId))
      .limit(1);

    if (
      preference?.campusLatitude === null ||
      preference?.campusLatitude === undefined ||
      preference.campusLongitude === null ||
      preference.campusLongitude === undefined
    ) {
      return null;
    }
    return {
      campusLatitude: preference.campusLatitude,
      campusLongitude: preference.campusLongitude,
    };
  }

  /**
   * ユーザーと対象日の既存バッチを取得する。
   *
   * @param userId - Better AuthのユーザーID。
   * @param targetDate - YYYY-MM-DD形式の対象日。
   * @returns 既存バッチ。未作成ならnull。
   */
  async findBatch(
    userId: string,
    targetDate: string,
  ): Promise<RecommendationBatchRecord | null> {
    const [batch] = await this.database
      .select({
        id: schema.recommendationBatches.id,
        status: schema.recommendationBatches.status,
      })
      .from(schema.recommendationBatches)
      .where(
        and(
          eq(schema.recommendationBatches.userId, userId),
          eq(schema.recommendationBatches.targetDate, targetDate),
        ),
      )
      .limit(1);
    return batch ?? null;
  }

  /**
   * pending状態の日次推薦バッチを作成する。
   *
   * @param userId - Better AuthのユーザーID。
   * @param targetDate - YYYY-MM-DD形式の対象日。
   * @returns 作成したバッチ。
   */
  async createBatch(
    userId: string,
    targetDate: string,
  ): Promise<RecommendationBatchRecord> {
    const [batch] = await this.database
      .insert(schema.recommendationBatches)
      .values({ userId, targetDate })
      .returning({
        id: schema.recommendationBatches.id,
        status: schema.recommendationBatches.status,
      });
    if (batch === undefined) {
      throw new Error("推薦バッチを作成できませんでした。");
    }
    return batch;
  }

  /**
   * バッチを処理中へ変更する。
   *
   * @param batchId - 推薦バッチID。
   * @returns なし。
   */
  async markBatchProcessing(batchId: string): Promise<void> {
    await this.database
      .update(schema.recommendationBatches)
      .set({ status: "processing", startedAt: new Date() })
      .where(eq(schema.recommendationBatches.id, batchId));
  }

  /**
   * バッチを失敗へ変更する。
   *
   * @param batchId - 推薦バッチID。
   * @returns なし。
   */
  async markBatchFailed(batchId: string): Promise<void> {
    await this.database
      .update(schema.recommendationBatches)
      .set({ status: "failed" })
      .where(eq(schema.recommendationBatches.id, batchId));
  }

  /**
   * Google Place IDに一致する保存済み店舗を取得する。
   *
   * @param googlePlaceIds - 検索するGoogle Place ID一覧。
   * @returns 保存済み店舗一覧。
   */
  async findRestaurantsByGooglePlaceIds(
    googlePlaceIds: readonly string[],
  ): Promise<StoredRestaurant[]> {
    if (googlePlaceIds.length === 0) {
      return [];
    }

    const rows = await this.database
      .select({
        id: schema.restaurants.id,
        googlePlaceId: schema.restaurants.googlePlaceId,
        name: schema.restaurants.name,
        address: schema.restaurants.address,
        latitude: schema.restaurants.latitude,
        longitude: schema.restaurants.longitude,
        currencyCode: schema.restaurantPriceRanges.currencyCode,
        startPrice: schema.restaurantPriceRanges.startPrice,
        endPrice: schema.restaurantPriceRanges.endPrice,
      })
      .from(schema.restaurants)
      .leftJoin(
        schema.restaurantPriceRanges,
        eq(schema.restaurantPriceRanges.restaurantId, schema.restaurants.id),
      )
      .where(inArray(schema.restaurants.googlePlaceId, [...googlePlaceIds]));

    return rows.map((row) => ({
      id: row.id,
      googlePlaceId: row.googlePlaceId,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      priceRange:
        row.currencyCode !== null && row.startPrice !== null
          ? {
              currencyCode: row.currencyCode,
              startPrice: row.startPrice,
              endPrice: row.endPrice,
            }
          : null,
    }));
  }

  /**
   * 選出結果をまとめて保存してバッチを完了する。
   *
   * @param input - バッチ、選出店舗、新規店舗詳細。
   * @returns APIへ返す保存済み推薦結果。
   */
  async completeBatch(
    input: CompleteRecommendationBatchInput,
  ): Promise<GenerateRecommendationsOutput> {
    return this.database.transaction(async (transaction) => {
      for (const details of input.newRestaurantDetails) {
        await transaction
          .insert(schema.restaurants)
          .values({
            googlePlaceId: details.googlePlaceId,
            name: details.name,
            address: details.address,
            latitude: details.latitude,
            longitude: details.longitude,
          })
          .onConflictDoNothing({ target: schema.restaurants.googlePlaceId });
      }

      const placeIds = input.selections.map(
        (selection) => selection.googlePlaceId,
      );
      const storedRows = await transaction
        .select()
        .from(schema.restaurants)
        .where(inArray(schema.restaurants.googlePlaceId, placeIds));
      const restaurantsByPlaceId = new Map(
        storedRows.map((restaurant) => [restaurant.googlePlaceId, restaurant]),
      );

      for (const details of input.newRestaurantDetails) {
        const restaurant = restaurantsByPlaceId.get(details.googlePlaceId);
        if (restaurant === undefined || details.priceRange === null) {
          continue;
        }
        await transaction
          .insert(schema.restaurantPriceRanges)
          .values({ restaurantId: restaurant.id, ...details.priceRange })
          .onConflictDoUpdate({
            target: schema.restaurantPriceRanges.restaurantId,
            set: { ...details.priceRange, updatedAt: new Date() },
          });
      }

      const priceRows = await transaction
        .select()
        .from(schema.restaurantPriceRanges)
        .where(
          inArray(
            schema.restaurantPriceRanges.restaurantId,
            storedRows.map((restaurant) => restaurant.id),
          ),
        );
      const pricesByRestaurantId = new Map(
        priceRows.map((priceRange) => [priceRange.restaurantId, priceRange]),
      );

      const categories: GenerateRecommendationsOutput["categories"] = [];
      const categoryNames = [
        ...new Set(input.selections.map((selection) => selection.category)),
      ];

      for (const categoryName of categoryNames) {
        const [category] = await transaction
          .insert(schema.recommendationCategories)
          .values({ batchId: input.batchId, category: categoryName })
          .returning();
        if (category === undefined) {
          throw new Error("推薦カテゴリを保存できませんでした。");
        }

        const recommendations: GenerateRecommendationsOutput["categories"][number]["recommendations"] =
          [];
        const categorySelections = input.selections.filter(
          (selection) => selection.category === categoryName,
        );

        for (const selection of categorySelections) {
          const restaurant = restaurantsByPlaceId.get(selection.googlePlaceId);
          if (restaurant === undefined) {
            throw new Error("選出店舗を保存できませんでした。");
          }
          const [recommendation] = await transaction
            .insert(schema.recommendations)
            .values({
              batchId: input.batchId,
              recommendationCategoryId: category.id,
              restaurantId: restaurant.id,
              distanceGroup: selection.distanceGroup,
              distanceMeters: selection.distanceMeters,
              campusToRestaurantSeconds: selection.campusToRestaurantSeconds,
            })
            .returning();
          if (recommendation === undefined) {
            throw new Error("推薦店舗を保存できませんでした。");
          }
          const priceRange = pricesByRestaurantId.get(restaurant.id);
          recommendations.push({
            id: recommendation.id,
            distanceGroup: recommendation.distanceGroup,
            distanceMeters: recommendation.distanceMeters,
            campusToRestaurantSeconds: recommendation.campusToRestaurantSeconds,
            restaurant: {
              id: restaurant.id,
              googlePlaceId: restaurant.googlePlaceId,
              name: restaurant.name,
              address: restaurant.address,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              priceRange:
                priceRange === undefined
                  ? null
                  : {
                      currencyCode: priceRange.currencyCode,
                      startPrice: priceRange.startPrice,
                      endPrice: priceRange.endPrice,
                    },
            },
          });
        }

        categories.push({
          id: category.id,
          category: category.category as LunchRecommendationCategory,
          recommendations,
        });
      }

      await transaction
        .update(schema.recommendationBatches)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(schema.recommendationBatches.id, input.batchId));

      return {
        batchId: input.batchId,
        targetDate: input.targetDate,
        status: "completed",
        categories,
      };
    });
  }
}
