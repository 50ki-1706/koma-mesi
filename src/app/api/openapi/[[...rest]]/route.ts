/**
 * oRPCから生成したREST API、OpenAPI JSON、Swagger UIを公開する。
 * `/api/openapi`でSwagger、`/api/openapi/spec.json`で仕様を確認できる。
 */

import { createORPCContext } from "@/lib/orpc/context";
import { openAPIHandler } from "@/lib/orpc/openapi";

/**
 * OpenAPI互換リクエストをoRPCルーターへ渡す。
 *
 * @param request - Next.js Route Handlerが受け取ったリクエスト。
 * @returns Swagger、仕様JSON、またはREST APIのレスポンス。
 */
async function handleRequest(request: Request): Promise<Response> {
  const { response } = await openAPIHandler.handle(request, {
    prefix: "/api/openapi",
    context: await createORPCContext(),
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
