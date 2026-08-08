/**
 * 座標登録済みユーザー全員の日次推薦を生成するCron処理を定義する。
 * Vercel Cronの認証と、ユーザー単位の成功・スキップ・失敗を集計する。
 */

import type { GenerateDailyRecommendationsCommand } from "./generate";
import { formatJapanDate, RecommendationGenerationError } from "./generate";
import type { RecommendationCronRepository } from "./repository";
import type {
  DailyRecommendationCronOutput,
  GenerateRecommendationsOutput,
} from "./schemas";

/** Cronから呼び出すユーザー単位の推薦生成処理。 */
export type DailyRecommendationGenerator = (
  command: GenerateDailyRecommendationsCommand,
) => Promise<GenerateRecommendationsOutput>;

/** 日次推薦Cronの依存関係。 */
export interface RunDailyRecommendationCronDependencies {
  repository: RecommendationCronRepository;
  generateRecommendations: DailyRecommendationGenerator;
  now?: () => Date;
}

/** Cron Route Handlerの依存関係。 */
export interface DailyRecommendationCronHandlerDependencies {
  cronSecret: string | undefined;
  run: () => Promise<DailyRecommendationCronOutput>;
}

/**
 * 座標登録済みユーザー全員について、同じ対象日の日次推薦を生成する。
 *
 * @param dependencies - 対象ユーザーRepository、生成処理、任意の現在時刻。
 * @returns 対象日とユーザーごとの処理件数。
 */
export async function runDailyRecommendationCron(
  dependencies: RunDailyRecommendationCronDependencies,
): Promise<DailyRecommendationCronOutput> {
  const targetDate = formatJapanDate(dependencies.now?.() ?? new Date());
  const userIds = await dependencies.repository.findEligibleUserIds();
  let completedUsers = 0;
  let skippedUsers = 0;
  let failedUsers = 0;

  for (const userId of userIds) {
    try {
      await dependencies.generateRecommendations({ userId, targetDate });
      completedUsers += 1;
    } catch (error) {
      if (
        error instanceof RecommendationGenerationError &&
        error.code === "BATCH_ALREADY_EXISTS"
      ) {
        skippedUsers += 1;
      } else {
        failedUsers += 1;
      }
    }
  }

  return {
    targetDate,
    totalUsers: userIds.length,
    completedUsers,
    skippedUsers,
    failedUsers,
  };
}

/**
 * CRON_SECRET認証付きのRoute Handlerを生成する。
 *
 * @param dependencies - 共有シークレットと日次Cron実行関数。
 * @returns Vercel CronからGETで呼び出すRoute Handler。
 */
export function createDailyRecommendationCronHandler(
  dependencies: DailyRecommendationCronHandlerDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (
      dependencies.cronSecret === undefined ||
      dependencies.cronSecret.length === 0 ||
      request.headers.get("authorization") !==
        `Bearer ${dependencies.cronSecret}`
    ) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
      const result = await dependencies.run();
      return Response.json(result, {
        status: result.failedUsers > 0 ? 500 : 200,
      });
    } catch {
      return Response.json(
        { message: "日次推薦Cronを実行できませんでした。" },
        { status: 500 },
      );
    }
  };
}
