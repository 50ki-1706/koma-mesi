/**
 * oRPCルーターのprocedureをサーバー側から呼び出して検証する。
 * health・推薦生成・初期設定APIの入出力契約を保証する。
 */
import { createClient } from "@libsql/client";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeekdayValue } from "@/constants/initialSetup";
import { db } from "@/db";
import { migrateWithEmptyStatementsFiltered } from "@/db/migrate";
import * as schema from "@/db/schema";
import { RecommendationGenerationError } from "@/shared/recommendations/generate";
import { createDailyRecommendationMock } from "@/shared/recommendations/mock";
import type { ORPCContext } from "./context";
import { router } from "./router";

type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;
type TestSession = NonNullable<ORPCContext["session"]>;

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

/**
 * 全マイグレーションを適用したインメモリSQLiteのテスト用DBを作成する。
 *
 * @returns テスト用Drizzle DBと接続を閉じるためのLibSQLクライアント。
 */
async function createTestDatabase(): Promise<{
  client: ReturnType<typeof createClient>;
  db: TestDatabase;
}> {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrateWithEmptyStatementsFiltered(db, {
    migrationsFolder: "./drizzle",
  });

  return { client, db };
}

/**
 * 初期設定処理で参照するテストユーザーを登録する。
 *
 * @param db - テスト用Drizzle DB。
 * @param userId - 登録するユーザーID。
 * @returns ユーザー登録完了時に解決するPromise。
 */
async function insertTestUser(db: TestDatabase, userId: string): Promise<void> {
  await db.insert(schema.user).values({
    id: userId,
    name: "Test User",
    email: `${userId}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * 認証済みコンテキストに渡す最小限のBetter Authセッションを作成する。
 *
 * @param userId - セッションに紐づけるユーザーID。
 * @returns テスト用の認証済みセッション。
 */
function createTestSession(userId: string): TestSession {
  const now = new Date();
  return {
    session: {
      id: `session-${userId}`,
      userId,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1_000),
      token: `token-${userId}`,
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: userId,
      name: "Test User",
      email: `${userId}@example.com`,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

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
      call(
        router.recommendation.generate,
        {},
        {
          context: {
            db,
            session: authenticatedSession,
            generateRecommendations: generate,
            getRecommendations,
          },
        },
      ),
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
      call(
        router.recommendation.generate,
        {},
        {
          context: {
            db,
            session: authenticatedSession,
            generateRecommendations: generate,
            getRecommendations,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("予期しない生成エラーをINTERNAL_SERVER_ERRORへ変換する", async () => {
    const generate = vi.fn(async () => {
      throw new Error("unexpected");
    });

    await expect(
      call(
        router.recommendation.generate,
        {},
        {
          context: {
            db,
            session: authenticatedSession,
            generateRecommendations: generate,
            getRecommendations,
          },
        },
      ),
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

describe("router.initialSetup", () => {
  let client: ReturnType<typeof createClient> | undefined;
  let testDb: TestDatabase;

  beforeEach(async () => {
    const testDatabase = await createTestDatabase();
    client = testDatabase.client;
    testDb = testDatabase.db;
  });

  afterEach(() => {
    client?.close();
    client = undefined;
  });

  it("未認証の場合はエラーを返す", async () => {
    await expect(
      call(router.initialSetup.status, undefined, {
        context: {
          db: testDb,
          session: null,
          generateRecommendations,
          getRecommendations,
        },
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  });

  it("設定未完了の場合は false を返す", async () => {
    const userId = "status-incomplete-user";
    await insertTestUser(testDb, userId);

    const result = await call(router.initialSetup.status, undefined, {
      context: {
        db: testDb,
        session: createTestSession(userId),
        generateRecommendations,
        getRecommendations,
      },
    });

    expect(result).toEqual({ isCompleted: false });
  });

  it("設定完了済みの場合は true を返す", async () => {
    const userId = "status-complete-user";
    await insertTestUser(testDb, userId);
    await testDb.insert(schema.userPreferences).values({
      userId,
      campusAddress: "〒100-0001 東京都千代田区1-1",
    });

    const result = await call(router.initialSetup.status, undefined, {
      context: {
        db: testDb,
        session: createTestSession(userId),
        generateRecommendations,
        getRecommendations,
      },
    });

    expect(result).toEqual({ isCompleted: true });
  });

  it("未認証の場合はエラーを返す", async () => {
    await expect(
      call(
        router.initialSetup.complete,
        {
          postalCode: "100-0001",
          prefecture: "東京都",
          streetAddress: "千代田区1-1",
          lunchStartTime: "12:00",
          lunchEndTime: "13:00",
          lunchDays: ["monday"],
        },
        {
          context: {
            db: testDb,
            session: null,
            generateRecommendations,
            getRecommendations,
          },
        },
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  });

  it("有効な入力で作成できる", async () => {
    const userId = "complete-create-user";
    await insertTestUser(testDb, userId);

    const result = await call(
      router.initialSetup.complete,
      {
        postalCode: "100-0001",
        prefecture: "東京都",
        streetAddress: "千代田区1-1",
        lunchStartTime: "12:00",
        lunchEndTime: "13:00",
        lunchDays: ["monday", "wednesday"],
      },
      {
        context: {
          db: testDb,
          session: createTestSession(userId),
          generateRecommendations,
          getRecommendations,
        },
      },
    );
    const preference = await testDb.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
    });

    expect(result).toEqual({ success: true });
    expect(preference).toMatchObject({
      userId,
      campusAddress: "〒100-0001 東京都千代田区1-1",
      lunchStartTime: "12:00",
      lunchEndTime: "13:00",
      lunchDays: "monday,wednesday",
    });
  });

  it("既存レコードを更新できる", async () => {
    const userId = "complete-update-user";
    const oldUpdatedAt = new Date("2020-01-01T00:00:00.000Z");
    await insertTestUser(testDb, userId);
    await testDb.insert(schema.userPreferences).values({
      userId,
      campusAddress: "〒100-0001 東京都千代田区1-1",
      campusLatitude: 35.681236,
      campusLongitude: 139.767125,
      lunchStartTime: "11:00",
      lunchEndTime: "12:00",
      lunchDays: "monday",
      createdAt: oldUpdatedAt,
      updatedAt: oldUpdatedAt,
    });

    await call(
      router.initialSetup.complete,
      {
        postalCode: "150-0001",
        prefecture: "東京都",
        streetAddress: "渋谷区1-2",
        lunchStartTime: "12:30",
        lunchEndTime: "13:30",
        lunchDays: ["friday"],
      },
      {
        context: {
          db: testDb,
          session: createTestSession(userId),
          generateRecommendations,
          getRecommendations,
        },
      },
    );
    const preference = await testDb.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
    });

    expect(preference).toMatchObject({
      campusAddress: "〒150-0001 東京都渋谷区1-2",
      campusLatitude: null,
      campusLongitude: null,
      lunchStartTime: "12:30",
      lunchEndTime: "13:30",
      lunchDays: "friday",
    });

    const updatedAt = preference?.updatedAt;
    expect(updatedAt).toBeInstanceOf(Date);
    if (!(updatedAt instanceof Date)) {
      throw new Error("Expected updatedAt to be a Date");
    }
    expect(updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
  });

  it("不正な時間形式の場合はエラーを返す", async () => {
    const userId = "complete-invalid-time-user";
    await insertTestUser(testDb, userId);

    await expect(
      call(
        router.initialSetup.complete,
        {
          postalCode: "100-0001",
          prefecture: "東京都",
          streetAddress: "千代田区1-1",
          lunchStartTime: "9:00",
          lunchEndTime: "13:00",
          lunchDays: ["monday"],
        },
        {
          context: {
            db: testDb,
            session: createTestSession(userId),
            generateRecommendations,
            getRecommendations,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("空の曜日配列の場合はエラーを返す", async () => {
    const userId = "complete-empty-days-user";
    await insertTestUser(testDb, userId);

    await expect(
      call(
        router.initialSetup.complete,
        {
          postalCode: "100-0001",
          prefecture: "東京都",
          streetAddress: "千代田区1-1",
          lunchStartTime: "12:00",
          lunchEndTime: "13:00",
          lunchDays: [],
        },
        {
          context: {
            db: testDb,
            session: createTestSession(userId),
            generateRecommendations,
            getRecommendations,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.each([
    ["postalCode", { postalCode: "   " }],
    ["prefecture", { prefecture: "   " }],
    ["streetAddress", { streetAddress: "   " }],
  ] as const)(
    "住所の%sが空白だけの場合はBAD_REQUESTを返す",
    async (field, value) => {
      const userId = `complete-invalid-address-${field}`;
      await insertTestUser(testDb, userId);

      await expect(
        call(
          router.initialSetup.complete,
          {
            postalCode: "100-0001",
            prefecture: "東京都",
            streetAddress: "千代田区1-1",
            lunchStartTime: "12:00",
            lunchEndTime: "13:00",
            lunchDays: ["monday"],
            ...value,
          },
          {
            context: {
              db: testDb,
              session: createTestSession(userId),
              generateRecommendations,
              getRecommendations,
            },
          },
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    },
  );

  it("3つの住所項目をtrimして保存する", async () => {
    const userId = "complete-trimmed-address-user";
    await insertTestUser(testDb, userId);

    await call(
      router.initialSetup.complete,
      {
        postalCode: " 100-0001 ",
        prefecture: " 東京都 ",
        streetAddress: " 千代田区1-1 ",
        lunchStartTime: "12:00",
        lunchEndTime: "13:00",
        lunchDays: ["monday"],
      },
      {
        context: {
          db: testDb,
          session: createTestSession(userId),
          generateRecommendations,
          getRecommendations,
        },
      },
    );
    const preference = await testDb.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
    });

    expect(preference?.campusAddress).toBe("〒100-0001 東京都千代田区1-1");
  });

  it.each([
    ["時", "24:00", "13:00"],
    ["分", "12:60", "13:00"],
  ] as const)(
    "%sが範囲外の時間はBAD_REQUESTを返す",
    async (unit, startTime, endTime) => {
      const userId = `complete-invalid-time-range-${unit}`;
      await insertTestUser(testDb, userId);

      await expect(
        call(
          router.initialSetup.complete,
          {
            postalCode: "100-0001",
            prefecture: "東京都",
            streetAddress: "千代田区1-1",
            lunchStartTime: startTime,
            lunchEndTime: endTime,
            lunchDays: ["monday"],
          },
          {
            context: {
              db: testDb,
              session: createTestSession(userId),
              generateRecommendations,
              getRecommendations,
            },
          },
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    },
  );

  it.each([
    ["同じ", "12:00", "12:00"],
    ["逆順", "13:00", "12:00"],
  ] as const)(
    "開始・終了時刻が%s場合はBAD_REQUESTを返す",
    async (order, startTime, endTime) => {
      const userId = `complete-invalid-time-order-${order}`;
      await insertTestUser(testDb, userId);

      await expect(
        call(
          router.initialSetup.complete,
          {
            postalCode: "100-0001",
            prefecture: "東京都",
            streetAddress: "千代田区1-1",
            lunchStartTime: startTime,
            lunchEndTime: endTime,
            lunchDays: ["monday"],
          },
          {
            context: {
              db: testDb,
              session: createTestSession(userId),
              generateRecommendations,
              getRecommendations,
            },
          },
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    },
  );

  it("許可されていない曜日を含む場合はBAD_REQUESTを返す", async () => {
    const userId = "complete-invalid-weekday-user";
    await insertTestUser(testDb, userId);

    await expect(
      call(
        router.initialSetup.complete,
        {
          postalCode: "100-0001",
          prefecture: "東京都",
          streetAddress: "千代田区1-1",
          lunchStartTime: "12:00",
          lunchEndTime: "13:00",
          lunchDays: ["sunday"] as unknown as WeekdayValue[],
        },
        {
          context: {
            db: testDb,
            session: createTestSession(userId),
            generateRecommendations,
            getRecommendations,
          },
        },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("曜日が重複除去・ソートされて保存される", async () => {
    const userId = "complete-sorted-days-user";
    await insertTestUser(testDb, userId);

    await call(
      router.initialSetup.complete,
      {
        postalCode: "100-0001",
        prefecture: "東京都",
        streetAddress: "千代田区1-1",
        lunchStartTime: "12:00",
        lunchEndTime: "13:00",
        lunchDays: ["friday", "monday", "friday", "wednesday"],
      },
      {
        context: {
          db: testDb,
          session: createTestSession(userId),
          generateRecommendations,
          getRecommendations,
        },
      },
    );
    const preference = await testDb.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
    });

    expect(preference?.lunchDays).toBe("monday,wednesday,friday");
  });
});
