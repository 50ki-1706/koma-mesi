/**
 * oRPCリクエストへ認証・DB・推薦生成の依存関係を提供する。
 * サーバー専用のGoogle APIキーはprocedure実行時に読み込む。
 */
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { DailyRecommendationGenerator } from "@/shared/recommendations/cron";
import { generateDailyRecommendations } from "@/shared/recommendations/generate";
import {
  GooglePlacesClient,
  requireGoogleMapsApiKey,
} from "@/shared/recommendations/googlePlaces";
import {
  type GetDailyRecommendationsCommand,
  getDailyRecommendations,
} from "@/shared/recommendations/read";
import { DrizzleRecommendationRepository } from "@/shared/recommendations/repository";
import type { GetRecommendationsOutput } from "@/shared/recommendations/schemas";

/** 推薦生成procedureから呼び出すユースケース。 */
export type RecommendationGenerator = DailyRecommendationGenerator;

/** 推薦取得procedureから呼び出すユースケース。 */
export type RecommendationReader = (
  command: GetDailyRecommendationsCommand,
) => Promise<GetRecommendationsOutput>;

/**
 * リクエストの認証情報、DB、推薦生成ユースケースをoRPCへ渡す。
 *
 * @returns oRPC procedureが共有するリクエストコンテキスト。
 */
export async function createORPCContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const repository = new DrizzleRecommendationRepository(db);
  const generateRecommendations: RecommendationGenerator = (command) => {
    const googlePlaces = new GooglePlacesClient(requireGoogleMapsApiKey());
    return generateDailyRecommendations(
      {
        repository,
        googlePlaces,
      },
      command,
    );
  };
  const getRecommendations: RecommendationReader = (command) =>
    getDailyRecommendations({ repository }, command);

  return {
    db,
    session,
    generateRecommendations,
    getRecommendations,
  };
}

/** oRPC procedureが共有するリクエストコンテキスト。 */
export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;
