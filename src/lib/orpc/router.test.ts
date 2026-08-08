/**
 * oRPCルーターのprocedureをサーバー側から呼び出して検証する。
 * healthと認証付き推薦生成APIの入出力契約を保証する。
 */
import { call } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import type { GenerateRecommendationsOutput } from "@/shared/recommendations/schemas";
import type { ORPCContext } from "./context";
import { router } from "./router";

const generateRecommendations = async () => {
  throw new Error("このテストでは推薦生成を呼び出しません。");
};

/**
 * 推薦生成procedureの正常レスポンスを生成する。
 *
 * @returns 3カテゴリ×3店舗のレスポンス。
 */
function createRecommendationOutput(): GenerateRecommendationsOutput {
  const categories = ["和食", "ラーメン", "カフェ・スイーツ"] as const;
  const distanceGroups = ["near", "middle", "far"] as const;
  return {
    batchId: "batch-1",
    targetDate: "2026-08-09",
    status: "completed",
    categories: categories.map((category, categoryIndex) => ({
      id: `category-${categoryIndex}`,
      category,
      recommendations: distanceGroups.map((distanceGroup, index) => ({
        id: `recommendation-${categoryIndex}-${index}`,
        distanceGroup,
        distanceMeters: (index + 1) * 200,
        campusToRestaurantSeconds: (index + 1) * 120,
        restaurant: {
          id: `restaurant-${categoryIndex}-${index}`,
          googlePlaceId: `place-${categoryIndex}-${index}`,
          name: `店舗${categoryIndex}-${index}`,
          address: "東京都千代田区1-1",
          latitude: 35.681236,
          longitude: 139.767125,
          priceRange: null,
        },
      })),
    })),
  };
}

const authenticatedSession = {
  session: {
    id: "session-1",
    userId: "user-1",
    token: "token",
    expiresAt: new Date("2026-08-10T00:00:00Z"),
    createdAt: new Date("2026-08-09T00:00:00Z"),
    updatedAt: new Date("2026-08-09T00:00:00Z"),
    ipAddress: null,
    userAgent: null,
  },
  user: {
    id: "user-1",
    name: "利用者",
    email: "user@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-08-09T00:00:00Z"),
    updatedAt: new Date("2026-08-09T00:00:00Z"),
  },
} as ORPCContext["session"];

describe("router.health", () => {
  it("正常状態を返す", async () => {
    const result = await call(router.health, undefined, {
      context: { db, session: null, generateRecommendations },
    });

    expect(result).toEqual({ ok: true });
  });
});

describe("router.recommendation.generate", () => {
  it("ログインユーザーの日次推薦を生成して返す", async () => {
    const generate = vi.fn(async () => createRecommendationOutput());

    const result = await call(
      router.recommendation.generate,
      { targetDate: "2026-08-09" },
      {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations: generate,
        },
      },
    );

    expect(result).toEqual(createRecommendationOutput());
    expect(generate).toHaveBeenCalledWith({
      userId: "user-1",
      targetDate: "2026-08-09",
    });
  });

  it("未ログインでは推薦を生成しない", async () => {
    const generate = vi.fn(async () => createRecommendationOutput());

    await expect(
      call(
        router.recommendation.generate,
        { targetDate: "2026-08-09" },
        {
          context: {
            db,
            session: null,
            generateRecommendations: generate,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("YYYY-MM-DD形式でない対象日を拒否する", async () => {
    await expect(
      call(
        router.recommendation.generate,
        { targetDate: "2026-8-9" },
        {
          context: {
            db,
            session: authenticatedSession,
            generateRecommendations,
          },
        },
      ),
    ).rejects.toThrow();
  });
});
