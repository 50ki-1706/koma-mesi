/**
 * アプリケーションが公開するoRPC procedureを1つのルーターへ集約する。
 * healthと日次推薦関連の型をクライアントへ公開する。
 */
import { os } from "@orpc/server";
import type { ORPCContext } from "./context";
import { recommendationRouter } from "./recommendation";

const base = os.$context<ORPCContext>();

/** アプリケーションが公開するoRPCルーター。 */
export const router = {
  health: base.handler(() => {
    return { ok: true };
  }),
  recommendation: recommendationRouter,
};

/** クライアントへ共有するoRPCルーター型。 */
export type AppRouter = typeof router;
