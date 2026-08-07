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

// テスト用の未認証コンテキスト
const unauthContext: ORPCContext = { db, session: null };

function createUnauthedClient() {
  return createRouterClient(router, {
    context: unauthContext,
  });
}

describe("router health procedure", () => {
  it("health エンドポイントが ok: true を返すこと", async () => {
    const client = createUnauthedClient();
    const result = await client.health();
    expect(result).toEqual({ ok: true });
  });
});
