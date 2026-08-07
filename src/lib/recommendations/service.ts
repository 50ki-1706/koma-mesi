// 推薦対象日の決定と日次推薦取得を担うService層を提供する。
// Vercelの実行地域に依存せず、日本時間の対象日をRepositoryへ渡す。

import { RECOMMENDATION_TIME_ZONE } from "@/constants/recommendation";
import type { ORPCContext } from "@/lib/orpc/context";
import type { DailyRecommendation } from "./model";
import { findCompletedDailyRecommendations } from "./repository";

/**
 * 日時を推薦対象日の文字列表現へ変換する。
 *
 * @param date - 対象日を求める日時
 * @returns 日本時間のYYYY-MM-DD形式の日付
 */
export function formatRecommendationTargetDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RECOMMENDATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("推薦対象日を計算できませんでした");
  }

  return `${year}-${month}-${day}`;
}

/**
 * ログイン中ユーザーの今日の推薦一覧を取得する。
 *
 * @param database - Drizzleデータベース
 * @param userId - Better AuthのユーザーID
 * @param now - 対象日判定の基準日時
 * @returns 今日の完了済み推薦一覧
 */
export async function listTodaysRecommendations(
  database: ORPCContext["db"],
  userId: string,
  now = new Date(),
): Promise<DailyRecommendation[]> {
  return findCompletedDailyRecommendations(
    database,
    userId,
    formatRecommendationTargetDate(now),
  );
}
