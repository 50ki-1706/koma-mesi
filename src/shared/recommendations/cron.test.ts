/**
 * 日次推薦Cronのユーザー集計とCRON_SECRET認証を検証する。
 * 外部APIとDBをスタブ化し、部分失敗時のHTTP状態も保証する。
 */

import { describe, expect, it, vi } from "vitest";
import {
  createDailyRecommendationCronHandler,
  runDailyRecommendationCron,
} from "./cron";
import { RecommendationGenerationError } from "./generate";
import { createDailyRecommendationMock } from "./mock";

describe("runDailyRecommendationCron", () => {
  it("生成済みユーザーを飛ばし、成功と失敗を集計する", async () => {
    const generateRecommendations = vi.fn(async ({ userId }) => {
      if (userId === "user-skipped") {
        throw new RecommendationGenerationError(
          "BATCH_ALREADY_EXISTS",
          "生成済みです。",
        );
      }
      if (userId === "user-failed") {
        throw new Error("Google API error");
      }
      return createDailyRecommendationMock("2026-08-09");
    });

    const result = await runDailyRecommendationCron({
      repository: {
        findEligibleUserIds: vi.fn(async () => [
          "user-completed",
          "user-skipped",
          "user-failed",
        ]),
      },
      generateRecommendations,
      now: () => new Date("2026-08-09T02:00:00Z"),
    });

    expect(result).toEqual({
      targetDate: "2026-08-09",
      totalUsers: 3,
      completedUsers: 1,
      skippedUsers: 1,
      failedUsers: 1,
    });
    expect(generateRecommendations).toHaveBeenCalledTimes(3);
  });
});

describe("createDailyRecommendationCronHandler", () => {
  it("Bearerトークンが一致しなければ実行しない", async () => {
    const run = vi.fn(async () => ({
      targetDate: "2026-08-09",
      totalUsers: 0,
      completedUsers: 0,
      skippedUsers: 0,
      failedUsers: 0,
    }));
    const handler = createDailyRecommendationCronHandler({
      cronSecret: "cron-secret",
      run,
    });

    const response = await handler(
      new Request("https://example.com/api/cron/recommendations"),
    );

    expect(response.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("一部ユーザーが失敗した場合は500と集計結果を返す", async () => {
    const handler = createDailyRecommendationCronHandler({
      cronSecret: "cron-secret",
      run: vi.fn(async () => ({
        targetDate: "2026-08-09",
        totalUsers: 2,
        completedUsers: 1,
        skippedUsers: 0,
        failedUsers: 1,
      })),
    });

    const response = await handler(
      new Request("https://example.com/api/cron/recommendations", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ failedUsers: 1 });
  });
});
