// Drizzle Kit configuration.
// Loads database credentials from the shared resolver so CLI commands match runtime behavior.

import { defineConfig } from "drizzle-kit";
import { resolveDatabaseCredentials } from "./src/db/env";

const { url, authToken } = resolveDatabaseCredentials();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    ...(authToken !== undefined && { authToken }),
  },
});
