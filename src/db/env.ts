// Resolves Turso database credentials from the runtime environment.
// Handles Vercel production/preview targets plus local file-based development.

import { DEFAULT_DATABASE_URL } from "@/constants/database";

/**
 * Resolve the database URL and optional auth token for the current environment.
 *
 * @param env - Environment variable object to read from (defaults to `process.env`).
 * @returns An object containing the database `url` and, for remote environments, an `authToken`.
 * @throws When remote credentials are incomplete, ambiguous, or the Vercel environment is unsupported.
 */
export function resolveDatabaseCredentials(
  env: Record<string, string | undefined> = process.env,
): { url: string; authToken?: string } {
  const vercelEnvironment = env.VERCEL_ENV || env.VERCEL_TARGET_ENV;

  if (vercelEnvironment === "production") {
    return resolveRemoteCredentials(env, "production");
  }

  if (vercelEnvironment === "preview") {
    return resolveRemoteCredentials(env, "preview");
  }

  if (vercelEnvironment === "development") {
    return resolveLocalCredentials(env);
  }

  if (vercelEnvironment !== undefined && vercelEnvironment !== "") {
    throw new Error(`Unsupported Vercel environment: ${vercelEnvironment}`);
  }

  const hasProductionCredentials = hasRemoteCredential(env, "production");
  const hasPreviewCredentials = hasRemoteCredential(env, "preview");

  if (hasProductionCredentials && hasPreviewCredentials) {
    throw new Error(
      "Cannot infer database environment because both production and preview credentials are configured",
    );
  }

  if (hasProductionCredentials) {
    return resolveRemoteCredentials(env, "production");
  }

  if (hasPreviewCredentials) {
    return resolveRemoteCredentials(env, "preview");
  }

  return resolveLocalCredentials(env);
}

type RemoteEnvironment = "production" | "preview";

/**
 * Resolves local or explicitly supplied generic database credentials.
 *
 * @param env - Environment variable object containing optional generic credentials.
 * @returns Local database URL and an optional auth token.
 */
function resolveLocalCredentials(env: Record<string, string | undefined>): {
  url: string;
  authToken?: string;
} {
  const url = env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const authToken = env.DATABASE_AUTH_TOKEN;

  return {
    url,
    ...(authToken !== undefined && { authToken }),
  };
}

/**
 * Checks whether either credential for a remote environment is configured.
 *
 * @param env - Environment variable object to inspect.
 * @param target - Remote environment whose credentials should be checked.
 * @returns Whether a URL or auth token is present for the target.
 */
function hasRemoteCredential(
  env: Record<string, string | undefined>,
  target: RemoteEnvironment,
): boolean {
  const prefix = target === "production" ? "PRODUCTION" : "PREVIEW";
  return Boolean(
    env[`${prefix}_TURSO_DATABASE_URL`] || env[`${prefix}_TURSO_AUTH_TOKEN`],
  );
}

/**
 * Resolves a complete Turso credential pair for a remote environment.
 *
 * @param env - Environment variable object containing Turso credentials.
 * @param target - Remote environment whose credentials should be returned.
 * @returns Validated Turso URL and auth token.
 * @throws When the URL or auth token is missing.
 */
function resolveRemoteCredentials(
  env: Record<string, string | undefined>,
  target: RemoteEnvironment,
): { url: string; authToken: string } {
  const prefix = target === "production" ? "PRODUCTION" : "PREVIEW";
  const url = env[`${prefix}_TURSO_DATABASE_URL`];
  const authToken = env[`${prefix}_TURSO_AUTH_TOKEN`];

  if (!url) {
    throw new Error(`Missing ${prefix}_TURSO_DATABASE_URL`);
  }
  if (!authToken) {
    throw new Error(`Missing ${prefix}_TURSO_AUTH_TOKEN`);
  }

  return { url, authToken };
}
