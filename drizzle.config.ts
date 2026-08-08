/**
 * Drizzle Kit configuration for the SQLite schema and migration output.
 * Uses DATABASE_URL or the shared local database fallback.
 */

import { defineConfig } from "drizzle-kit";
import { DEFAULT_DATABASE_URL } from "./src/constants/database";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
