// アプリケーションが公開する oRPC Controllerを構成する。
// 稼働確認とログイン中ユーザーの日次推薦取得を提供する。

import { os } from "@orpc/server";
import { listTodaysRecommendations } from "../recommendations/service";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();

/**
 * 認証コンテキストからユーザーIDを取得する。
 *
 * @param context - oRPCリクエストコンテキスト
 * @returns Better AuthのユーザーID
 */
function getUserId(context: ORPCContext): string {
  const userId = context.session?.user.id;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

const protectedProcedure = base.use(async ({ context, next }) => {
  if (!context.session) {
    throw new Error("UNAUTHORIZED");
  }

  return next();
});

/** アプリケーションの oRPC ルーター。 */
export const router = {
  health: base.handler(() => {
    return { ok: true };
  }),
  recommendation: {
    listToday: protectedProcedure.handler(async ({ context }) => {
      return listTodaysRecommendations(context.db, getUserId(context));
    }),
  },
};

/** クライアントが利用するルーター型。 */
export type AppRouter = typeof router;
