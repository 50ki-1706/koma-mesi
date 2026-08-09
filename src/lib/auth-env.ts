// Resolves the server-only credentials required by Better Auth.
// Fails early when Google OAuth or the cross-environment proxy is not configured.

/** Credentials required to initialize the authentication server. */
export interface AuthCredentials {
  allowedHosts: string[];
  productionUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  oauthProxySecret: string;
}

/**
 * Resolves and validates credentials used by Better Auth.
 *
 * @param env - Environment variables to resolve credentials from.
 * @returns Validated Google OAuth and OAuth Proxy credentials.
 * @throws When one or more required credentials are missing.
 */
export function resolveAuthCredentials(
  env: Record<string, string | undefined> = process.env,
): AuthCredentials {
  const googleClientId = env.GOOGLE_CLIENT_ID;
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET;
  const oauthProxySecret = env.OAUTH_PROXY_SECRET;
  const productionUrl = env.AUTH_PRODUCTION_URL;
  const allowedHosts =
    env.AUTH_ALLOWED_HOSTS?.split(",")
      .map((host) => host.trim())
      .filter((host) => host.length > 0) ?? [];

  if (!googleClientId?.trim() || !googleClientSecret?.trim()) {
    throw new Error("Google OAuth credentials are required");
  }

  if (!oauthProxySecret?.trim()) {
    throw new Error("OAUTH_PROXY_SECRET is required");
  }

  if (!productionUrl?.trim()) {
    throw new Error("AUTH_PRODUCTION_URL is required");
  }

  if (allowedHosts.length === 0) {
    throw new Error("AUTH_ALLOWED_HOSTS is required");
  }

  return {
    allowedHosts,
    productionUrl,
    googleClientId,
    googleClientSecret,
    oauthProxySecret,
  };
}
