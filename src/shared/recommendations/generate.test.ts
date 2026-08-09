/**
 * 日次推薦生成ユースケースのバッチ制御と既存店舗再利用を検証する。
 * RepositoryとGoogle Placesをスタブ化し、外部通信なしで失敗状態も保証する。
 */

import { describe, expect, it, vi } from "vitest";
import type { GenerateRecommendationsOutput } from "@/shared/schema";
import { formatJapanDate } from "../japanDate";
import type { RecommendationGenerationError } from "./generate";
import { generateDailyRecommendations } from "./generate";
import type { GooglePlaceDetails, GooglePlacesGateway } from "./googlePlaces";
import type {
  CompleteRecommendationBatchInput,
  RecommendationRepository,
  StoredRestaurant,
} from "./repository";

/**
 * 保存入力からテスト用の正常レスポンスを生成する。
 *
 * @param input - Repositoryへ渡された完了入力。
 * @returns 3カテゴリ×3店舗のAPIレスポンス。
 */
function createOutput(
  input: CompleteRecommendationBatchInput,
): GenerateRecommendationsOutput {
  const detailsByPlaceId = new Map(
    input.newRestaurantDetails.map((details) => [
      details.googlePlaceId,
      details,
    ]),
  );
  const categories = [
    ...new Set(input.selections.map((selection) => selection.category)),
  ].map((category, categoryIndex) => ({
    id: `category-${categoryIndex}`,
    category,
    recommendations: input.selections
      .filter((selection) => selection.category === category)
      .map((selection, recommendationIndex) => {
        const details = detailsByPlaceId.get(selection.googlePlaceId);
        return {
          id: `recommendation-${categoryIndex}-${recommendationIndex}`,
          distanceGroup: selection.distanceGroup,
          distanceMeters: selection.distanceMeters,
          campusToRestaurantSeconds: selection.campusToRestaurantSeconds,
          restaurant: {
            id: `restaurant-${selection.googlePlaceId}`,
            googlePlaceId: selection.googlePlaceId,
            name: details?.name ?? "保存済み店舗",
            address: details?.address ?? "東京都",
            latitude: details?.latitude ?? 35,
            longitude: details?.longitude ?? 139,
            priceRange: details?.priceRange ?? null,
          },
        };
      }),
  }));
  return {
    batchId: input.batchId,
    targetDate: input.targetDate,
    status: "completed",
    categories,
  };
}

/**
 * 推薦ユースケース用のRepositoryスタブを生成する。
 *
 * @param storedRestaurants - 保存済みとして返す店舗。
 * @returns Vitest spyを持つRepository。
 */
function createRepository(
  storedRestaurants: StoredRestaurant[] = [],
): RecommendationRepository {
  return {
    findUserPreference: vi.fn(async () => ({
      campusLatitude: 35.681236,
      campusLongitude: 139.767125,
    })),
    findBatch: vi.fn(async () => null),
    createBatch: vi.fn(async () => ({
      id: "batch-1",
      status: "pending" as const,
    })),
    markBatchProcessing: vi.fn(async () => undefined),
    markBatchFailed: vi.fn(async () => undefined),
    findRestaurantsByGooglePlaceIds: vi.fn(async () => storedRestaurants),
    completeBatch: vi.fn(async (input) => createOutput(input)),
  };
}

/**
 * カテゴリごとに重複しない3候補を返すGoogle Placesスタブを生成する。
 *
 * @returns Vitest spyを持つGoogle Places Gateway。
 */
function createGooglePlaces(): GooglePlacesGateway {
  let searchCount = 0;
  return {
    searchNearby: vi.fn(async () => {
      searchCount += 1;
      return [100, 400, 700].map((distanceMeters, index) => ({
        googlePlaceId: `place-${searchCount}-${index}`,
        distanceMeters,
        campusToRestaurantSeconds: distanceMeters,
      }));
    }),
    getPlaceDetails: vi.fn(
      async (googlePlaceId): Promise<GooglePlaceDetails> => ({
        googlePlaceId,
        name: `店舗${googlePlaceId}`,
        address: "東京都千代田区1-1",
        latitude: 35.681236,
        longitude: 139.767125,
        priceRange: null,
      }),
    ),
  };
}

describe("formatJapanDate", () => {
  it("UTCでは前日でも日本時間の当日を返す", () => {
    expect(formatJapanDate(new Date("2026-08-08T16:00:00Z"))).toBe(
      "2026-08-09",
    );
  });
});

describe("generateDailyRecommendations", () => {
  it("バッチを作成し3カテゴリ×3店舗を保存して返す", async () => {
    const repository = createRepository();
    const googlePlaces = createGooglePlaces();

    const result = await generateDailyRecommendations(
      { repository, googlePlaces, random: () => 0 },
      { userId: "user-1", targetDate: "2026-08-09" },
    );

    expect(result.categories).toHaveLength(3);
    expect(
      result.categories.flatMap((item) => item.recommendations),
    ).toHaveLength(9);
    expect(repository.markBatchProcessing).toHaveBeenCalledWith("batch-1");
    expect(repository.completeBatch).toHaveBeenCalledOnce();
    expect(googlePlaces.getPlaceDetails).toHaveBeenCalledTimes(9);
    expect(repository.markBatchFailed).not.toHaveBeenCalled();
  });

  it("保存済み店舗についてPlace Detailsを再取得しない", async () => {
    const repository = createRepository([
      {
        id: "restaurant-existing",
        googlePlaceId: "place-1-0",
        name: "保存済み店舗",
        address: "東京都",
        latitude: 35,
        longitude: 139,
        priceRange: null,
      },
    ]);
    const googlePlaces = createGooglePlaces();

    await generateDailyRecommendations(
      { repository, googlePlaces, random: () => 0 },
      { userId: "user-1", targetDate: "2026-08-09" },
    );

    expect(googlePlaces.getPlaceDetails).toHaveBeenCalledTimes(8);
  });

  it("大学座標がなければバッチを作成しない", async () => {
    const repository = createRepository();
    vi.mocked(repository.findUserPreference).mockResolvedValue(null);

    await expect(
      generateDailyRecommendations(
        { repository, googlePlaces: createGooglePlaces() },
        { userId: "user-1", targetDate: "2026-08-09" },
      ),
    ).rejects.toMatchObject({
      code: "CAMPUS_LOCATION_REQUIRED",
    } satisfies Partial<RecommendationGenerationError>);
    expect(repository.createBatch).not.toHaveBeenCalled();
  });

  it("対象日のバッチが存在する場合は生成済みエラーを返す", async () => {
    const repository = createRepository();
    vi.mocked(repository.findBatch).mockResolvedValue({
      id: "existing-batch",
      status: "completed",
    });

    await expect(
      generateDailyRecommendations(
        { repository, googlePlaces: createGooglePlaces() },
        { userId: "user-1", targetDate: "2026-08-09" },
      ),
    ).rejects.toMatchObject({
      code: "BATCH_ALREADY_EXISTS",
    } satisfies Partial<RecommendationGenerationError>);
    expect(repository.createBatch).not.toHaveBeenCalled();
  });

  it("対象日を省略すると日本時間の当日でバッチを作成する", async () => {
    const repository = createRepository();

    await generateDailyRecommendations(
      {
        repository,
        googlePlaces: createGooglePlaces(),
        now: () => new Date("2026-08-08T16:00:00Z"),
      },
      { userId: "user-1" },
    );

    expect(repository.createBatch).toHaveBeenCalledWith("user-1", "2026-08-09");
  });

  it("バッチ作成が競合したら生成済みエラーに変換する", async () => {
    const repository = createRepository();
    vi.mocked(repository.createBatch).mockResolvedValue(null);

    await expect(
      generateDailyRecommendations(
        { repository, googlePlaces: createGooglePlaces() },
        { userId: "user-1", targetDate: "2026-08-09" },
      ),
    ).rejects.toMatchObject({
      code: "BATCH_ALREADY_EXISTS",
    } satisfies Partial<RecommendationGenerationError>);
    expect(repository.markBatchProcessing).not.toHaveBeenCalled();
  });

  it("生成途中で失敗したらバッチをfailedへ変更する", async () => {
    const repository = createRepository();
    const googlePlaces = createGooglePlaces();
    vi.mocked(googlePlaces.searchNearby).mockRejectedValue(
      new Error("Google API error"),
    );

    await expect(
      generateDailyRecommendations(
        { repository, googlePlaces },
        { userId: "user-1", targetDate: "2026-08-09" },
      ),
    ).rejects.toThrow("Google API error");
    expect(repository.markBatchFailed).toHaveBeenCalledWith("batch-1");
  });
});
