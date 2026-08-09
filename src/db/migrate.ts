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
import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql";
import { type MigrationConfig, readMigrationFiles } from "drizzle-orm/migrator";
import { resolveDatabaseCredentials } from "./env";
import * as schema from "./schema";

/**
 * 実行対象となるSQLセグメントかどうかを判定する。
 * 空文字や空白のみのセグメントは @libsql/client に渡すとエラーになるため除外対象とする。
 *
 * @param statement - 判定対象のSQLセグメント。
 * @returns 実行可能なSQLが含まれていれば true。
 */
function isExecutableStatement(statement: string): boolean {
  return statement.trim().length > 0;
}

/**
 * Drizzleの標準migratorを代替し、空のSQLセグメントを@libsql/clientに渡す前に除外する。
 * マイグレーションファイルの末尾に `--> statement-breakpoint` がある場合、
 * 空文字列のセグメントが生成され `LibsqlBatchError: SQLITE_UNKNOWN_0: not an error` が発生する問題を回避する。
 *
 * @param db - マイグレーションを実行するDrizzle LibSQLデータベースインスタンス。
 * @param config - マイグレーションフォルダなどの設定。
 * @returns マイグレーション完了時に解決するPromise。
 */
export async function migrateWithEmptyStatementsFiltered<
  TSchema extends Record<string, unknown>,
>(db: LibSQLDatabase<TSchema>, config: MigrationConfig): Promise<void> {
  const migrations = readMigrationFiles(config);
  const migrationsTable = config.migrationsTable ?? "__drizzle_migrations";

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const dbMigrations = await db.values<[number, string, string]>(
    sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
  );
  const lastDbMigration = dbMigrations[0] ?? undefined;

  for (const migration of migrations) {
    if (
      !lastDbMigration ||
      Number(lastDbMigration[2]) < migration.folderMillis
    ) {
      for (const statement of migration.sql) {
        if (isExecutableStatement(statement)) {
          await db.run(sql.raw(statement));
        }
      }
      await db.run(
        sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`,
      );
    }
  }
}

/** Options for running migrations */
export interface RunMigrationsOptions {
  /** Database URL. When omitted, it is resolved from the current environment. */
  databaseUrl?: string;
  /** Optional auth token paired with databaseUrl. */
  authToken?: string;
  /** Path to migrations folder (defaults to "./drizzle") */
  migrationsFolder?: string;
}

/**
 * Runs database migrations and validates foreign key integrity.
 * @param options - Migration configuration options
 * @returns マイグレーションと foreign key check の完了時に解決する Promise。
 * @throws {Error} if foreign key violations are detected after migration
 */
export async function runMigrations(
  options: RunMigrationsOptions = {},
): Promise<void> {
  const { databaseUrl, authToken, migrationsFolder = "./drizzle" } = options;
  const credentials =
    databaseUrl === undefined
      ? resolveDatabaseCredentials()
      : {
          url: databaseUrl,
          ...(authToken !== undefined && { authToken }),
        };

  const client: Client = createClient(credentials);

  try {
    await client.execute("PRAGMA foreign_keys = ON");

    const db = drizzle(client, { schema });

    console.log("Running migrations...");
    await migrateWithEmptyStatementsFiltered(db, { migrationsFolder });
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
