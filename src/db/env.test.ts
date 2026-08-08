// Tests for the database credential resolver.
// Covers Vercel production/preview targets and local development defaults.

import { describe, expect, it } from "vitest";
import { resolveDatabaseCredentials } from "./env";

describe("resolveDatabaseCredentials", () => {
  it("returns production credentials when all variables are set", () => {
    const env = {
      VERCEL_ENV: "production",
      PRODUCTION_TURSO_DATABASE_URL: "libsql://prod.example.com",
      PRODUCTION_TURSO_AUTH_TOKEN: "prod-token",
    };

    expect(resolveDatabaseCredentials(env)).toEqual({
      url: "libsql://prod.example.com",
      authToken: "prod-token",
    });
  });

  it("returns preview credentials when all variables are set", () => {
    const env = {
      VERCEL_ENV: "preview",
      PREVIEW_TURSO_DATABASE_URL: "libsql://preview.example.com",
      PREVIEW_TURSO_AUTH_TOKEN: "preview-token",
    };

    expect(resolveDatabaseCredentials(env)).toEqual({
      url: "libsql://preview.example.com",
      authToken: "preview-token",
    });
  });

  it('returns the local SQLite file when VERCEL_ENV is "development"', () => {
    const env = { VERCEL_ENV: "development" };

    expect(resolveDatabaseCredentials(env)).toEqual({ url: "file:local.db" });
  });

  it("returns the local SQLite file when VERCEL_ENV is undefined", () => {
    const env = {};

    expect(resolveDatabaseCredentials(env)).toEqual({ url: "file:local.db" });
  });

  it("returns the local SQLite file when VERCEL_ENV is empty", () => {
    expect(resolveDatabaseCredentials({ VERCEL_ENV: "" })).toEqual({
      url: "file:local.db",
    });
  });

  it("returns explicitly configured credentials for local commands", () => {
    const env = {
      DATABASE_URL: "libsql://local-command.example.com",
      DATABASE_AUTH_TOKEN: "local-command-token",
    };

    expect(resolveDatabaseCredentials(env)).toEqual({
      url: "libsql://local-command.example.com",
      authToken: "local-command-token",
    });
  });

  it("throws when production URL is missing", () => {
    const env = {
      VERCEL_ENV: "production",
      PRODUCTION_TURSO_AUTH_TOKEN: "prod-token",
    };

    expect(() => resolveDatabaseCredentials(env)).toThrow(
      "Missing PRODUCTION_TURSO_DATABASE_URL",
    );
  });

  it("throws when production auth token is missing", () => {
    const env = {
      VERCEL_ENV: "production",
      PRODUCTION_TURSO_DATABASE_URL: "libsql://prod.example.com",
    };

    expect(() => resolveDatabaseCredentials(env)).toThrow(
      "Missing PRODUCTION_TURSO_AUTH_TOKEN",
    );
  });

  it("throws when preview URL is missing", () => {
    const env = {
      VERCEL_ENV: "preview",
      PREVIEW_TURSO_AUTH_TOKEN: "preview-token",
    };

    expect(() => resolveDatabaseCredentials(env)).toThrow(
      "Missing PREVIEW_TURSO_DATABASE_URL",
    );
  });

  it("throws when preview auth token is missing", () => {
    const env = {
      VERCEL_ENV: "preview",
      PREVIEW_TURSO_DATABASE_URL: "libsql://preview.example.com",
    };

    expect(() => resolveDatabaseCredentials(env)).toThrow(
      "Missing PREVIEW_TURSO_AUTH_TOKEN",
    );
  });

  it("throws for an unsupported VERCEL_ENV value", () => {
    const env = { VERCEL_ENV: "unknown_value" };

    expect(() => resolveDatabaseCredentials(env)).toThrow(
      "Unsupported VERCEL_ENV: unknown_value",
    );
  });
});
