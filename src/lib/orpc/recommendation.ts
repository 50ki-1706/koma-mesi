/**
 * 日次推薦を手動生成するoRPC procedureを定義する。
 * Zodで入出力を検証し、対象ユーザーは認証セッションから決定する。
 */

import { ORPCError, os } from "@orpc/server";
import {
  type GenerateDailyRecommendationsCommand,
  RecommendationGenerationError,
} from "@/shared/recommendations/generate";
import {
  GenerateRecommendationsInputSchema,
  GenerateRecommendationsOutputSchema,
} from "@/shared/recommendations/schemas";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();

/**
 * 推薦生成の業務エラーをoRPCエラーへ変換する。
 *
 * @param error - 推薦生成処理から投げられた値。
 * @returns 常に例外を送出するため戻らない。
 */
function throwRecommendationError(error: unknown): never {
  if (error instanceof RecommendationGenerationError) {
    if (error.code === "BATCH_ALREADY_EXISTS") {
      throw new ORPCError("CONFLICT", { message: error.message });
    }
    throw new ORPCError("BAD_REQUEST", { message: error.message });
  }
  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "推薦を生成できませんでした。",
    cause: error,
  });
}

/** ログインユーザーの対象日について3カテゴリ×3店舗を生成する。 */
export const generateRecommendationsProcedure = base
  .input(GenerateRecommendationsInputSchema)
  .output(GenerateRecommendationsOutputSchema)
  .handler(async ({ context, input }) => {
    const userId = context.session?.user.id;
    if (userId === undefined) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "ログインが必要です。",
      });
    }

    const command: GenerateDailyRecommendationsCommand = {
      userId,
      targetDate: input.targetDate,
    };
    try {
      return await context.generateRecommendations(command);
    } catch (error) {
      return throwRecommendationError(error);
    }
  });

/** 推薦関連procedureをまとめたルーター。 */
export const recommendationRouter = {
  generate: generateRecommendationsProcedure,
};
