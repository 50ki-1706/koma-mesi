/**
 * フロントエンド用デモデータが日次推薦APIの契約を満たすことを検証する。
 * 3カテゴリ×3店舗とPlace IDの一意性を固定する。
 */

import { describe, expect, it } from "vitest";
import { createDailyRecommendationMock } from "./mock";
import { GenerateRecommendationsOutputSchema } from "./schemas";

describe("createDailyRecommendationMock", () => {
  it("APIと同じ3カテゴリ×3店舗のレスポンスを生成する", () => {
    const mock = createDailyRecommendationMock("2026-08-10");
    const recommendations = mock.categories.flatMap(
      (category) => category.recommendations,
    );

    expect(GenerateRecommendationsOutputSchema.safeParse(mock).success).toBe(
      true,
    );
    expect(mock.targetDate).toBe("2026-08-10");
    expect(mock.categories).toHaveLength(3);
    expect(recommendations).toHaveLength(9);
    expect(
      new Set(
        recommendations.map(
          (recommendation) => recommendation.restaurant.googlePlaceId,
        ),
      ),
    ).toHaveLength(9);
  });
});
