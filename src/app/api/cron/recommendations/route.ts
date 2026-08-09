/**
 * Vercel Cronから毎日呼び出される日次推薦生成エンドポイント。
 * CRON_SECRETで認証し、座標登録済みユーザー全員の生成処理を実行する。
 */

import { db } from "@/db";
import {
  createDailyRecommendationCronHandler,
  runDailyRecommendationCron,
} from "@/shared/recommendations/cron";
import { generateDailyRecommendations } from "@/shared/recommendations/generate";
import {
  GooglePlacesClient,
  requireGoogleMapsApiKey,
} from "@/shared/recommendations/googlePlaces";
import { DrizzleRecommendationRepository } from "@/shared/recommendations/repository";

/** 座標登録済みユーザー全員の日次推薦を生成する。 */
async function runCron() {
  const repository = new DrizzleRecommendationRepository(db);
  const googlePlaces = new GooglePlacesClient(requireGoogleMapsApiKey());

  return runDailyRecommendationCron({
    repository,
    generateRecommendations: (command) =>
      generateDailyRecommendations({ repository, googlePlaces }, command),
  });
}

/** Vercel Cronが呼び出すGET Route Handler。 */
export const GET = createDailyRecommendationCronHandler({
  cronSecret: process.env.CRON_SECRET,
  run: runCron,
});
