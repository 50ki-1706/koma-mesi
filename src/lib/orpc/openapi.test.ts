/**
 * oRPCルーターから生成されるOpenAPI仕様の主要パスを検証する。
 * 取得APIと生成APIがSwaggerへ自動反映されることを保証する。
 */

import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { createDailyRecommendationMock } from "@/shared/recommendations/mock";
import { openAPIHandler } from "./openapi";
import { router } from "./router";

describe("OpenAPI specification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("healthと日次推薦の取得・生成パスを公開する", async () => {
    const generator = new OpenAPIGenerator({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    });

    const specification = await generator.generate(router, {
      info: { title: "koma-mesi API", version: "1.0.0" },
    });
    const paths = specification.paths ?? {};

    expect(paths["/health"]?.get).toBeDefined();
    expect(paths["/recommendations"]?.get).toBeDefined();
    expect(paths["/recommendations/generate"]?.post).toBeDefined();
  });

  it("Swagger UIをHTMLとして返す", async () => {
    const { response } = await openAPIHandler.handle(
      new Request("https://example.com/api/openapi"),
      {
        prefix: "/api/openapi",
        context: {
          db,
          session: null,
          generateRecommendations: async () => createDailyRecommendationMock(),
          getRecommendations: async () => null,
          geocodeAddress: async () => null,
        },
      },
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toContain("text/html");
    await expect(response?.text()).resolves.toContain("SwaggerUIBundle");
  });

  it("設定したパスでOpenAPI仕様をJSONとして返す", async () => {
    const { response } = await openAPIHandler.handle(
      new Request("https://example.com/api/openapi/spec.json"),
      {
        prefix: "/api/openapi",
        context: {
          db,
          session: null,
          generateRecommendations: async () => createDailyRecommendationMock(),
          getRecommendations: async () => null,
          geocodeAddress: async () => null,
        },
      },
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toContain("application/json");
    await expect(response?.json()).resolves.toMatchObject({
      info: { title: "koma-mesi API", version: "1.0.0" },
    });
  });

  it.each(["/api/openapi", "/api/openapi/spec.json"])(
    "本番環境では%sを既定で公開しない",
    async (path) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ENABLE_API_DOCS", "false");
      vi.resetModules();
      const { openAPIHandler: productionHandler } = await import("./openapi");

      const { response } = await productionHandler.handle(
        new Request(`https://example.com${path}`),
        {
          prefix: "/api/openapi",
          context: {
            db,
            session: null,
            generateRecommendations: async () =>
              createDailyRecommendationMock(),
            getRecommendations: async () => null,
            geocodeAddress: async () => null,
          },
        },
      );

      expect(response).toBeUndefined();
    },
  );
});
