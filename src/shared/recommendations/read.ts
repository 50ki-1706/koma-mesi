/**
 * ログインユーザーの保存済み日次推薦を取得するユースケースを定義する。
 * 対象日を省略した場合は、推薦生成処理と同じ日本時間の当日を使用する。
 */

import { formatJapanDate } from "./generate";
import type { RecommendationReadRepository } from "./repository";
import type { GetRecommendationsOutput } from "./schemas";

/** 保存済み推薦取得ユースケースの依存関係。 */
export interface GetDailyRecommendationsDependencies {
  repository: RecommendationReadRepository;
  now?: () => Date;
}

/** 保存済み推薦取得ユースケースへの入力。 */
export interface GetDailyRecommendationsCommand {
  userId: string;
  targetDate?: string;
}

/**
 * ログインユーザーの対象日について、完了済み推薦を取得する。
 *
 * @param dependencies - Repositoryと任意の現在時刻。
 * @param command - 対象ユーザーと任意の対象日。
 * @returns 保存済み推薦。未生成または未完了の場合はnull。
 */
export async function getDailyRecommendations(
  dependencies: GetDailyRecommendationsDependencies,
  command: GetDailyRecommendationsCommand,
): Promise<GetRecommendationsOutput> {
  const targetDate =
    command.targetDate ?? formatJapanDate(dependencies.now?.() ?? new Date());

  return dependencies.repository.findCompletedRecommendation(
    command.userId,
    targetDate,
  );
}
