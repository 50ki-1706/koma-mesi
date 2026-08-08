/**
 * Database client initialization and connection setup.
 * Establishes the libSQL client connection and configures SQLite pragmas.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { DEFAULT_DATABASE_URL } from "@/constants/database";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
});

// Enable foreign key enforcement for this connection.
// SQLite has foreign_keys OFF by default; we must explicitly enable it.
await client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
