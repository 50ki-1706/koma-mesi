/**
  認証情報と日次の飲食店推薦結果を永続化するDBスキーマを定義する。
  SQLite上の制約により、推薦バッチ・カテゴリ・店舗間の整合性を保証する。
 */
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  foreignKey,
  unique,
} from "drizzle-orm/sqlite-core";
import {
  DISTANCE_GROUPS,
  HOTPEPPER_GENRES,
  RECOMMENDATION_BATCH_STATUSES,
} from "@/constants/recommendationSchema";

/**
  CHECK制約で使う文字列値を、エスケープ済みのSQLリストへ変換する。

  @param values - SQL文字列リテラルへ変換する値。
  @returns カンマ区切りのSQL文字列リテラル。
 */
function toSqlStringList(values: readonly string[]): string {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

/** Better Authが管理するユーザーテーブル。 */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Better Authが管理するセッションテーブル。 */
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

/** Better Authが管理する外部認証アカウントテーブル。 */
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Better Authが管理する検証トークンテーブル。 */
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/**ユーザーごとの推薦検索起点となる大学住所を保持するテーブル。 */
export const userPreferences = sqliteTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "no action" }),
  campusAddress: text("campus_address").notNull(),
  campusLatitude: real("campus_latitude"),
  campusLongitude: real("campus_longitude"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/** ユーザー単位の日次推薦処理とその進行状態を保持するテーブル。 */
export const recommendationBatches = sqliteTable(
  "recommendation_batches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    targetDate: text("target_date").notNull(),
    status: text("status", { enum: RECOMMENDATION_BATCH_STATUSES })
      .notNull()
      .default("pending"),
    startedAt: integer("started_at", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("recommendation_batches_user_id_target_date_unique").on(
      table.userId,
      table.targetDate,
    ),
    check(
      "recommendation_batches_status_check",
      sql`${table.status} in (${sql.raw(
        toSqlStringList(RECOMMENDATION_BATCH_STATUSES),
      )})`,
    ),
    check(
      "recommendation_batches_target_date_check",
      sql`${table.targetDate} glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
  ],
);

/** 推薦バッチ内で選ばれた3つのカテゴリと選択順を保持するテーブル。 */
export const recommendationCategories = sqliteTable(
  "recommendation_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => recommendationBatches.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    category: text("category", { enum: HOTPEPPER_GENRES }).notNull(),
    selectionOrder: integer("selection_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("recommendation_categories_batch_id_category_unique").on(
      table.batchId,
      table.category,
    ),
    uniqueIndex("recommendation_categories_batch_id_selection_order_unique").on(
      table.batchId,
      table.selectionOrder,
    ),
    unique("recommendation_categories_id_batch_id_unique").on(
      table.id,
      table.batchId,
    ),
    check(
      "recommendation_categories_category_check",
      sql`${table.category} in (${sql.raw(toSqlStringList(HOTPEPPER_GENRES))})`,
    ),
    check(
      "recommendation_categories_selection_order_check",
      sql`${table.selectionOrder} between 1 and 3`,
    ),
  ],
);

/** Google Places上の店舗を再利用可能なマスタとして保持するテーブル。 */
export const restaurants = sqliteTable("restaurants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  googlePlaceId: text("google_place_id").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/** カテゴリごとに選出されたnear・middle・farの店舗を保持するテーブル。 */
export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id").notNull(),
    recommendationCategoryId: text("recommendation_category_id").notNull(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, {
        onDelete: "restrict",
        onUpdate: "no action",
      }),
    distanceGroup: text("distance_group", { enum: DISTANCE_GROUPS }).notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    foreignKey({
      columns: [table.recommendationCategoryId, table.batchId],
      foreignColumns: [
        recommendationCategories.id,
        recommendationCategories.batchId,
      ],
    })
      .onDelete("cascade")
      .onUpdate("no action"),

    uniqueIndex("recommendations_category_id_distance_group_unique").on(
      table.recommendationCategoryId,
      table.distanceGroup,
    ),
    uniqueIndex("recommendations_category_id_display_order_unique").on(
      table.recommendationCategoryId,
      table.displayOrder,
    ),
    check(
      "recommendations_distance_group_check",
      sql`${table.distanceGroup} in (${sql.raw(
        toSqlStringList(DISTANCE_GROUPS),
      )})`,
    ),
    check(
      "recommendations_distance_meters_check",
      sql`${table.distanceMeters} >= 0`,
    ),
    check(
      "recommendations_display_order_check",
      sql`${table.displayOrder} between 1 and 3`,
    ),
  ],
);
