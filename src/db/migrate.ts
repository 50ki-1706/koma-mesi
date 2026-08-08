/**
 * Custom migration runner with post-migration foreign key integrity validation.
 * Replaces `drizzle-kit migrate` to add PRAGMA foreign_key_check after migrations.
 *
 * Note: The integrity check occurs AFTER migrate() returns, so the migration is
 * already committed. If violations are found, the command fails but the migration
 * remains applied. This is a safety net to detect issues early, not a rollback
 * mechanism. Remediation would require manual intervention or a new migration.
 */
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { DEFAULT_DATABASE_URL } from "@/constants/database";
import * as schema from "./schema";

/** Options for running migrations */
export interface RunMigrationsOptions {
  /** Database URL (defaults to DEFAULT_DATABASE_URL) */
  databaseUrl?: string;
  /** Path to migrations folder (defaults to "./drizzle") */
  migrationsFolder?: string;
}

/**
 * Runs database migrations and validates foreign key integrity.
 * @param options - Migration configuration options
 * @throws {Error} if foreign key violations are detected after migration
 */
export async function runMigrations(
  options: RunMigrationsOptions = {},
): Promise<void> {
  const {
    databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    migrationsFolder = "./drizzle",
  } = options;

  const client: Client = createClient({ url: databaseUrl });

  try {
    await client.execute("PRAGMA foreign_keys = ON");

    const db = drizzle(client, { schema });

    console.log("Running migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Migrations complete.");

    console.log("Checking foreign key integrity...");
    const fkCheck = await client.execute("PRAGMA foreign_key_check");
    if (fkCheck.rows.length > 0) {
      const errorMessage = `Foreign key violations found after migration: ${JSON.stringify(fkCheck.rows, null, 2)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.log("Foreign key check passed.");
  } finally {
    client.close();
  }
}

// CLI entry point
const isMainModule =
  typeof process.argv[1] === "string" &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  runMigrations()
    .then(() => {
      console.log("Migration completed successfully.");
    })
    .catch((err: unknown) => {
      console.error("Migration failed:", err);
      process.exitCode = 1;
    });
}
