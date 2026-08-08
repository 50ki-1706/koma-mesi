/**
 * アプリケーションが公開するoRPC procedureを1つのルーターへ集約する。
 * healthと日次推薦関連の型をクライアントへ公開する。
 */
import { os } from "@orpc/server";
import { z } from "zod";
import type { ORPCContext } from "./context";
import { recommendationRouter } from "./recommendation";

const base = os.$context<ORPCContext>();

/** アプリケーションが公開するoRPCルーター。 */
export const router = {
  health: base
    .route({
      method: "GET",
      path: "/health",
      operationId: "health",
      summary: "APIの稼働状態を取得する",
      tags: ["system"],
    })
    .output(z.object({ ok: z.literal(true) }))
    .handler(() => {
      return { ok: true as const };
    }),
  recommendation: recommendationRouter,
};

/** クライアントへ共有するoRPCルーター型。 */
export type AppRouter = typeof router;
