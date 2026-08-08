/**
 * フロントエンド用デモデータが日次推薦APIの契約を満たすことを検証する。
 * 3カテゴリ×3店舗とPlace IDの一意性を固定する。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createDailyRecommendationMock } from "./mock";
import { GenerateRecommendationsOutputSchema } from "./schemas";

describe("createDailyRecommendationMock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("対象日を省略した場合は日本時間の当日を使用する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T16:00:00Z"));

    expect(createDailyRecommendationMock().targetDate).toBe("2026-08-09");
  });
});
