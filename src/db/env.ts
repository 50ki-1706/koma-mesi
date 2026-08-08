// Resolves Turso database credentials from the runtime environment.
// Handles Vercel production/preview targets plus local file-based development.

import { DEFAULT_DATABASE_URL } from "@/constants/database";

/**
 * Resolve the database URL and optional auth token for the current environment.
 *
 * @param env - Environment variable object to read from (defaults to `process.env`).
 * @returns An object containing the database `url` and, for remote environments, an `authToken`.
 * @throws When a required remote variable is missing or `VERCEL_ENV` has an unsupported value.
 */
export function resolveDatabaseCredentials(
  env: Record<string, string | undefined> = process.env,
): { url: string; authToken?: string } {
  const { VERCEL_ENV } = env;

  if (VERCEL_ENV === "production") {
    const url = env.PRODUCTION_TURSO_DATABASE_URL;
    const authToken = env.PRODUCTION_TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("Missing PRODUCTION_TURSO_DATABASE_URL");
    }
    if (!authToken) {
      throw new Error("Missing PRODUCTION_TURSO_AUTH_TOKEN");
    }

    return { url, authToken };
  }

  if (VERCEL_ENV === "preview") {
    const url = env.PREVIEW_TURSO_DATABASE_URL;
    const authToken = env.PREVIEW_TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("Missing PREVIEW_TURSO_DATABASE_URL");
    }
    if (!authToken) {
      throw new Error("Missing PREVIEW_TURSO_AUTH_TOKEN");
    }

    return { url, authToken };
  }

  if (
    VERCEL_ENV === "development" ||
    VERCEL_ENV === undefined ||
    VERCEL_ENV === ""
  ) {
    const url = env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
    const authToken = env.DATABASE_AUTH_TOKEN;

    return {
      url,
      ...(authToken !== undefined && { authToken }),
    };
  }

  throw new Error(`Unsupported VERCEL_ENV: ${VERCEL_ENV}`);
}
