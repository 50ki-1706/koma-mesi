import { createClient } from "@libsql/client";
import { createRouterClient } from "@orpc/server";
import { drizzle } from "drizzle-orm/libsql";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema";
import type { ORPCContext } from "./context";
import { router } from "./router";

// 全テストで同一のインメモリ SQLite インスタンスを共有
const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });

// テーブル再作成ヘルパー
async function recreateTables() {
  // FK制約を有効化
  await db.run("PRAGMA foreign_keys = ON");
  // FK順序を考慮して逆順にDROP
  await db.run("DROP TABLE IF EXISTS counter");
  await db.run("DROP TABLE IF EXISTS post");
  await db.run("DROP TABLE IF EXISTS verification");
  await db.run("DROP TABLE IF EXISTS account");
  await db.run("DROP TABLE IF EXISTS session");
  await db.run("DROP TABLE IF EXISTS user");
  // スキーマからテーブルを再作成
  await db.run(
    `CREATE TABLE user (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified integer NOT NULL, image text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
  );
  await db.run(
    `CREATE TABLE session (id text PRIMARY KEY, expires_at integer NOT NULL, token text NOT NULL UNIQUE, created_at integer NOT NULL, updated_at integer NOT NULL, ip_address text, user_agent text, user_id text NOT NULL REFERENCES user(id))`,
  );
  await db.run(
    `CREATE TABLE account (id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL, user_id text NOT NULL REFERENCES user(id), access_token text, refresh_token text, id_token text, access_token_expires_at integer, refresh_token_expires_at integer, scope text, password text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
  );
  await db.run(
    `CREATE TABLE verification (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expires_at integer NOT NULL, created_at integer, updated_at integer)`,
  );
  await db.run(
    `CREATE TABLE counter (id integer PRIMARY KEY AUTOINCREMENT, user_id text NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE, count integer NOT NULL DEFAULT 0)`,
  );
  await db.run(
    `CREATE TABLE post (id integer PRIMARY KEY AUTOINCREMENT, title text NOT NULL, created_at integer NOT NULL)`,
  );
}

// テスト用の認証済みコンテキストを作成
async function createAuthContext(
  userId = "test-user-id",
): Promise<ORPCContext> {
  await db.insert(schema.user).values({
    id: userId,
    name: "Test User",
    email: `${userId}@example.com`,
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    db,
    session: {
      user: { id: userId },
    } as ORPCContext["session"],
  };
}

// テスト用の未認証コンテキスト
const unauthContext: ORPCContext = { db, session: null };

async function createAuthedClient(userId = "test-user-id") {
  const context = await createAuthContext(userId);
  return createRouterClient(router, {
    context,
  });
}

function createUnauthedClient() {
  return createRouterClient(router, {
    context: unauthContext,
  });
}

describe("counter procedures", () => {
  beforeEach(async () => {
    await recreateTables();
  });

  describe("counter.get", () => {
    it("初回呼び出しで count=0 のカウンターが自動作成される", async () => {
      const client = await createAuthedClient("user-1");
      const result = await client.counter.get();
      expect(result).toMatchObject({ userId: "user-1", count: 0 });
    });

    it("2回目以降で既存の count がそのまま返る", async () => {
      const client = await createAuthedClient("user-2");
      const first = await client.counter.get();
      expect(first.count).toBe(0);

      const second = await client.counter.get();
      expect(second.count).toBe(0);
      expect(second.id).toBe(first.id);
    });
  });

  describe("counter.increment", () => {
    it("未作成状態から実行 → count=1", async () => {
      const client = await createAuthedClient("user-3");
      const result = await client.counter.increment();
      expect(result).toMatchObject({ userId: "user-3", count: 1 });
    });

    it("既存のカウンターが +1 される", async () => {
      const client = await createAuthedClient("user-4");
      await client.counter.increment();
      const result = await client.counter.increment();
      expect(result.count).toBe(2);
    });

    it("同時実行で count が正しく加算される", async () => {
      const client = await createAuthedClient("user-5");
      const results = await Promise.all(
        Array.from({ length: 10 }, () => client.counter.increment()),
      );
      expect(results[results.length - 1].count).toBe(10);
    });
  });

  describe("counter.decrement", () => {
    it("未作成状態から実行 → count=-1", async () => {
      const client = await createAuthedClient("user-6");
      const result = await client.counter.decrement();
      expect(result).toMatchObject({ userId: "user-6", count: -1 });
    });

    it("既存のカウンターが -1 される", async () => {
      const client = await createAuthedClient("user-7");
      await client.counter.decrement();
      const result = await client.counter.decrement();
      expect(result.count).toBe(-2);
    });

    it("同時実行で count が正しく減算される", async () => {
      const client = await createAuthedClient("user-8");
      const results = await Promise.all(
        Array.from({ length: 10 }, () => client.counter.decrement()),
      );
      expect(results[results.length - 1].count).toBe(-10);
    });
  });

  describe("混在同時実行", () => {
    it("increment 5回 + decrement 3回 → count=2", async () => {
      const client = await createAuthedClient("user-9");
      const ops = [
        ...Array.from({ length: 5 }, () => client.counter.increment()),
        ...Array.from({ length: 3 }, () => client.counter.decrement()),
      ];
      await Promise.all(ops);
      // 最後の戻り値が最終的なcountとは限らない（並列のため）が、
      // アトミック性により整合値になる
      const final = await client.counter.get();
      expect(final.count).toBe(2);
    });
  });

  describe("認可", () => {
    it("未認証で呼び出すとエラー", async () => {
      const client = createUnauthedClient();
      await expect(client.counter.get()).rejects.toThrow("UNAUTHORIZED");
      await expect(client.counter.increment()).rejects.toThrow("UNAUTHORIZED");
      await expect(client.counter.decrement()).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
