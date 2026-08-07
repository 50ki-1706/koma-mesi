// Better Auth とアプリケーションドメインの SQLite テーブルを定義する。
// 推薦データの整合性は外部キー・一意制約・CHECK 制約で担保する。

import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  DISTANCE_GROUPS,
  HOTPEPPER_GENRES,
  RECOMMENDATION_BATCH_STATUSES,
} from "@/constants/recommendation";
import { sqliteStringLiterals } from "@/shared/db/sqliteEnum";

/** Better Auth が管理するユーザーテーブル。 */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/** Better Auth が管理するセッションテーブル。 */
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

/** Better Auth が管理する外部プロバイダーアカウントテーブル。 */
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

/** Better Auth が管理する検証トークンテーブル。 */
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/** ユーザーごとの推薦条件を保持する設定テーブル。 */
export const userPreferences = sqliteTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  campusAddress: text("campus_address").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** ユーザーと対象日ごとの推薦処理を管理するバッチテーブル。 */
export const recommendationBatches = sqliteTable(
  "recommendation_batches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
      sql`${table.status} in (${sqliteStringLiterals(RECOMMENDATION_BATCH_STATUSES)})`,
    ),
  ],
);

/** 推薦バッチ内で選ばれた3つのカテゴリを保持するテーブル。 */
export const recommendationCategories = sqliteTable(
  "recommendation_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    batchId: text("batch_id")
      .notNull()
      .references(() => recommendationBatches.id, { onDelete: "cascade" }),
    category: text("category", { enum: HOTPEPPER_GENRES }).notNull(),
    selectionOrder: integer("selection_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("recommendation_categories_batch_id_id_unique").on(
      table.batchId,
      table.id,
    ),
    uniqueIndex("recommendation_categories_batch_id_category_unique").on(
      table.batchId,
      table.category,
    ),
    uniqueIndex("recommendation_categories_batch_id_selection_order_unique").on(
      table.batchId,
      table.selectionOrder,
    ),
    check(
      "recommendation_categories_category_check",
      sql`${table.category} in (${sqliteStringLiterals(HOTPEPPER_GENRES)})`,
    ),
    check(
      "recommendation_categories_selection_order_check",
      sql`${table.selectionOrder} between 1 and 3`,
    ),
  ],
);

/** Google Maps 上の店舗を重複なく保持する店舗マスタ。 */
export const restaurants = sqliteTable(
  "restaurants",
  {
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
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check(
      "restaurants_latitude_check",
      sql`${table.latitude} between -90 and 90`,
    ),
    check(
      "restaurants_longitude_check",
      sql`${table.longitude} between -180 and 180`,
    ),
  ],
);

/** カテゴリ・距離グループごとに選ばれた推薦店舗を保持するテーブル。 */
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
      .references(() => restaurants.id),
    distanceGroup: text("distance_group", { enum: DISTANCE_GROUPS }).notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    foreignKey({
      name: "recommendations_category_batch_fk",
      columns: [table.batchId, table.recommendationCategoryId],
      foreignColumns: [
        recommendationCategories.batchId,
        recommendationCategories.id,
      ],
    }).onDelete("cascade"),
    uniqueIndex("recommendations_category_id_distance_group_unique").on(
      table.recommendationCategoryId,
      table.distanceGroup,
    ),
    uniqueIndex("recommendations_category_id_display_order_unique").on(
      table.recommendationCategoryId,
      table.displayOrder,
    ),
    uniqueIndex("recommendations_category_id_restaurant_id_unique").on(
      table.recommendationCategoryId,
      table.restaurantId,
    ),
    check(
      "recommendations_distance_group_check",
      sql`${table.distanceGroup} in (${sqliteStringLiterals(DISTANCE_GROUPS)})`,
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
