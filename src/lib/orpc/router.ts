// アプリケーションが公開する oRPC エンドポイントを構成する。
// 現在は稼働確認用のヘルスチェックだけを提供する。

import { os } from "@orpc/server";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();

/** アプリケーションの oRPC ルーター。 */
export const router = {
  health: base.handler(() => {
    return { ok: true };
  }),
};

/** クライアントが利用するルーター型。 */
export type AppRouter = typeof router;
