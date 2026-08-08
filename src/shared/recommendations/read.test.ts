/**
 * 保存済み推薦取得ユースケースの日付解決とRepository呼び出しを検証する。
 * 実DBを使わず、未生成時にnullを返すAPI契約も保証する。
 */

import { describe, expect, it, vi } from "vitest";
import { getDailyRecommendations } from "./read";
import type { RecommendationReadRepository } from "./repository";

/**
 * 取得テスト用Repositoryを生成する。
 *
 * @returns 完了済み推薦がないRepositoryスタブ。
 */
function createRepository(): RecommendationReadRepository {
  return {
    findCompletedRecommendation: vi.fn(async () => null),
  };
}

describe("getDailyRecommendations", () => {
  it("対象日を省略すると日本時間の当日を取得する", async () => {
    const repository = createRepository();

    await expect(
      getDailyRecommendations(
        {
          repository,
          now: () => new Date("2026-08-08T16:00:00Z"),
        },
        { userId: "user-1" },
      ),
    ).resolves.toBeNull();

    expect(repository.findCompletedRecommendation).toHaveBeenCalledWith(
      "user-1",
      "2026-08-09",
    );
  });

  it("指定された対象日をそのまま使用する", async () => {
    const repository = createRepository();

    await getDailyRecommendations(
      { repository },
      { userId: "user-1", targetDate: "2026-08-10" },
    );

    expect(repository.findCompletedRecommendation).toHaveBeenCalledWith(
      "user-1",
      "2026-08-10",
    );
  });
});
