/**
 * Database client initialization and connection setup.
 * Uses environment-based credentials so the same code works locally and on Vercel.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resolveDatabaseCredentials } from "./env";
import * as schema from "./schema";

const { url, authToken } = resolveDatabaseCredentials();

const client = createClient({
  url,
  ...(authToken !== undefined && { authToken }),
});

// Enable foreign key enforcement for this connection.
// SQLite has foreign_keys OFF by default; we must explicitly enable it.
await client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
