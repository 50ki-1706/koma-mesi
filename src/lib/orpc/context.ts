/**
 * oRPCリクエストへ認証・DB・推薦生成の依存関係を提供する。
 * サーバー専用のGoogle APIキーはprocedure実行時に読み込む。
 */
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { GeocodedLocation } from "@/shared/campus/geocoding";
import { geocodeAddress } from "@/shared/campus/geocoding";
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
import type { GetRecommendationsOutput } from "@/shared/schema";

/** 推薦生成procedureから呼び出すユースケース。 */
export type RecommendationGenerator = DailyRecommendationGenerator;

/** 推薦取得procedureから呼び出すユースケース。 */
export type RecommendationReader = (
  command: GetDailyRecommendationsCommand,
) => Promise<GetRecommendationsOutput>;

/** 初期設定procedureから呼び出す住所ジオコーディング。失敗時はnullを返す。 */
export type AddressGeocoder = (
  address: string,
) => Promise<GeocodedLocation | null>;

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

  const geocodeCampusAddress: AddressGeocoder = async (address) => {
    try {
      return await geocodeAddress(address, requireGoogleMapsApiKey());
    } catch (error) {
      console.error("Failed to geocode campus address:", error);
      return null;
    }
  };

  return {
    db,
    session,
    generateRecommendations,
    getRecommendations,
    geocodeAddress: geocodeCampusAddress,
  };
}

/** oRPC procedureが共有するリクエストコンテキスト。 */
export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;
