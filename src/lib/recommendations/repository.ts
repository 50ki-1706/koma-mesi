// 推薦一覧に必要なデータをDrizzleで取得するRepository層を提供する。
// ユーザー・対象日・完了状態で絞り、カテゴリ順と店舗表示順を保証する。

import { and, asc, eq } from "drizzle-orm";
import {
  recommendationBatches,
  recommendationCategories,
  recommendations,
  restaurants,
} from "@/db/schema";
import type { ORPCContext } from "@/lib/orpc/context";
import type { DailyRecommendation } from "./model";

/**
 * 完了した日次推薦をユーザーと対象日で検索する。
 *
 * @param database - Drizzleデータベース
 * @param userId - Better AuthのユーザーID
 * @param targetDate - YYYY-MM-DD形式の推薦対象日
 * @returns カテゴリ順、店舗表示順に並んだ推薦一覧
 */
export async function findCompletedDailyRecommendations(
  database: ORPCContext["db"],
  userId: string,
  targetDate: string,
): Promise<DailyRecommendation[]> {
  return database
    .select({
      categoryId: recommendationCategories.id,
      category: recommendationCategories.category,
      selectionOrder: recommendationCategories.selectionOrder,
      recommendationId: recommendations.id,
      distanceGroup: recommendations.distanceGroup,
      distanceMeters: recommendations.distanceMeters,
      displayOrder: recommendations.displayOrder,
      restaurantId: restaurants.id,
      googlePlaceId: restaurants.googlePlaceId,
      restaurantName: restaurants.name,
      restaurantAddress: restaurants.address,
    })
    .from(recommendationBatches)
    .innerJoin(
      recommendationCategories,
      eq(recommendationCategories.batchId, recommendationBatches.id),
    )
    .innerJoin(
      recommendations,
      and(
        eq(recommendations.batchId, recommendationBatches.id),
        eq(
          recommendations.recommendationCategoryId,
          recommendationCategories.id,
        ),
      ),
    )
    .innerJoin(restaurants, eq(restaurants.id, recommendations.restaurantId))
    .where(
      and(
        eq(recommendationBatches.userId, userId),
        eq(recommendationBatches.targetDate, targetDate),
        eq(recommendationBatches.status, "completed"),
      ),
    )
    .orderBy(
      asc(recommendationCategories.selectionOrder),
      asc(recommendations.displayOrder),
    );
}
