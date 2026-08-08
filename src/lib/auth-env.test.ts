// Tests authentication credential resolution for server startup.
// Covers valid configuration and missing Google OAuth or proxy secrets.

import { describe, expect, it } from "vitest";
import { resolveAuthCredentials } from "./auth-env";

describe("resolveAuthCredentials", () => {
  it("returns all credentials when the environment is complete", () => {
    expect(
      resolveAuthCredentials({
        AUTH_ALLOWED_HOSTS:
          "localhost:3000, production.example.com, preview-*.example.com",
        AUTH_PRODUCTION_URL: "https://production.example.com",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
        OAUTH_PROXY_SECRET: "shared-proxy-secret",
      }),
    ).toEqual({
      allowedHosts: [
        "localhost:3000",
        "production.example.com",
        "preview-*.example.com",
      ],
      productionUrl: "https://production.example.com",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      oauthProxySecret: "shared-proxy-secret",
    });
  });

  it("throws when Google OAuth credentials are missing", () => {
    expect(() =>
      resolveAuthCredentials({
        AUTH_ALLOWED_HOSTS: "localhost:3000",
        AUTH_PRODUCTION_URL: "https://production.example.com",
        OAUTH_PROXY_SECRET: "shared-proxy-secret",
      }),
    ).toThrow("Google OAuth credentials are required");
  });

  it("throws when the OAuth Proxy secret is missing", () => {
    expect(() =>
      resolveAuthCredentials({
        AUTH_ALLOWED_HOSTS: "localhost:3000",
        AUTH_PRODUCTION_URL: "https://production.example.com",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
      }),
    ).toThrow("OAUTH_PROXY_SECRET is required");
  });

  it("throws when the production URL is missing", () => {
    expect(() =>
      resolveAuthCredentials({
        AUTH_ALLOWED_HOSTS: "localhost:3000",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
        OAUTH_PROXY_SECRET: "shared-proxy-secret",
      }),
    ).toThrow("AUTH_PRODUCTION_URL is required");
  });

  it("throws when allowed hosts are missing", () => {
    expect(() =>
      resolveAuthCredentials({
        AUTH_PRODUCTION_URL: "https://production.example.com",
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
        OAUTH_PROXY_SECRET: "shared-proxy-secret",
      }),
    ).toThrow("AUTH_ALLOWED_HOSTS is required");
  });
});
