/**
 * oRPCルーターのprocedureをサーバー側から呼び出して検証する。
 * health handlerが公開するレスポンス契約を保証する。
 */
import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { router } from "./router";

describe("router.health", () => {
  it("正常状態を返す", async () => {
    const result = await call(router.health, undefined, {
      context: { db, session: null },
    });

    expect(result).toEqual({ ok: true });
  });
});
