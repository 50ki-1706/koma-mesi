/**
 * oRPCルーターのprocedureをサーバー側から呼び出して検証する。
 * healthと認証付き推薦生成APIの入出力契約を保証する。
 */
import { call } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { RecommendationGenerationError } from "@/shared/recommendations/generate";
import { createDailyRecommendationMock } from "@/shared/recommendations/mock";
import type { ORPCContext } from "./context";
import { router } from "./router";

const generateRecommendations = async () => {
  throw new Error("このテストでは推薦生成を呼び出しません。");
};

const getRecommendations = async () => {
  throw new Error("このテストでは推薦取得を呼び出しません。");
};

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
      context: {
        db,
        session: null,
        generateRecommendations,
        getRecommendations,
      },
    });

    expect(result).toEqual({ ok: true });
  });
});

describe("router.recommendation.generate", () => {
  it("ログインユーザーの日次推薦を生成して返す", async () => {
    const generate = vi.fn(async () => createDailyRecommendationMock());

    const result = await call(
      router.recommendation.generate,
      { targetDate: "2026-08-09" },
      {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations: generate,
          getRecommendations,
        },
      },
    );

    expect(result).toEqual(createDailyRecommendationMock());
    expect(generate).toHaveBeenCalledWith({
      userId: "user-1",
      targetDate: "2026-08-09",
    });
  });

  it("未ログインでは推薦を生成しない", async () => {
    const generate = vi.fn(async () => createDailyRecommendationMock());

    await expect(
      call(
        router.recommendation.generate,
        { targetDate: "2026-08-09" },
        {
          context: {
            db,
            session: null,
            generateRecommendations: generate,
            getRecommendations,
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
            getRecommendations,
          },
        },
      ),
    ).rejects.toThrow();
  });

  it("生成済みエラーをCONFLICTへ変換する", async () => {
    const generate = vi.fn(async () => {
      throw new RecommendationGenerationError(
        "BATCH_ALREADY_EXISTS",
        "生成済みです。",
      );
    });

    await expect(
      call(router.recommendation.generate, {}, {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations: generate,
          getRecommendations,
        },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("入力に起因する生成エラーをBAD_REQUESTへ変換する", async () => {
    const generate = vi.fn(async () => {
      throw new RecommendationGenerationError(
        "CAMPUS_LOCATION_REQUIRED",
        "大学座標が必要です。",
      );
    });

    await expect(
      call(router.recommendation.generate, {}, {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations: generate,
          getRecommendations,
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("予期しない生成エラーをINTERNAL_SERVER_ERRORへ変換する", async () => {
    const generate = vi.fn(async () => {
      throw new Error("unexpected");
    });

    await expect(
      call(router.recommendation.generate, {}, {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations: generate,
          getRecommendations,
        },
      }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("router.recommendation.getDaily", () => {
  it("ログインユーザーの保存済み日次推薦を返す", async () => {
    const get = vi.fn(async () => createDailyRecommendationMock());

    const result = await call(
      router.recommendation.getDaily,
      { targetDate: "2026-08-09" },
      {
        context: {
          db,
          session: authenticatedSession,
          generateRecommendations,
          getRecommendations: get,
        },
      },
    );

    expect(result).toEqual(createDailyRecommendationMock());
    expect(get).toHaveBeenCalledWith({
      userId: "user-1",
      targetDate: "2026-08-09",
    });
  });

  it("未生成の場合はnullを返す", async () => {
    const get = vi.fn(async () => null);

    await expect(
      call(
        router.recommendation.getDaily,
        {},
        {
          context: {
            db,
            session: authenticatedSession,
            generateRecommendations,
            getRecommendations: get,
          },
        },
      ),
    ).resolves.toBeNull();
  });

  it("未ログインでは保存済み推薦を取得しない", async () => {
    const get = vi.fn(async () => createDailyRecommendationMock());

    await expect(
      call(
        router.recommendation.getDaily,
        {},
        {
          context: {
            db,
            session: null,
            generateRecommendations,
            getRecommendations: get,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(get).not.toHaveBeenCalled();
  });
});
