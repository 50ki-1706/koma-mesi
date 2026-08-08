/**
 * oRPCルーターからREST互換API、OpenAPI JSON、Swagger UIを生成する。
 * RPC用ルーターと同じZod入出力契約を利用し、仕様書の手動同期を不要にする。
 */

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { router } from "./router";

/** Swagger UIとOpenAPI JSONを提供するoRPC OpenAPI Handler。 */
export const openAPIHandler = new OpenAPIHandler(router, {
  plugins: [
    new OpenAPIReferencePlugin({
      docsProvider: "swagger",
      docsPath: "/",
      specPath: "/spec.json",
      docsTitle: "koma-mesi API",
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "koma-mesi API",
          version: "1.0.0",
          description: "大学周辺の昼食推薦を生成・取得するAPI",
        },
      },
    }),
  ],
});
