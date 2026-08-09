/**
  認証情報と日次の飲食店推薦結果を永続化するDBスキーマを定義する。
  SQLite上の制約により、推薦バッチ・カテゴリ・店舗間の整合性を保証する。
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  DISTANCE_GROUPS,
  HOTPEPPER_GENRES,
  RECOMMENDATION_BATCH_STATUSES,
} from "@/constants/recommendationSchema";

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
export const userPreferences = sqliteTable(
  "user_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    campusAddress: text("campus_address").notNull(),
    campusLatitude: real("campus_latitude"),
    campusLongitude: real("campus_longitude"),
    lunchStartTime: text("lunch_start_time"),
    lunchEndTime: text("lunch_end_time"),
    /**
     * Comma-delimited lunch weekdays persisted using the exact vocabulary
     * monday,tuesday,wednesday,thursday,friday.
     */
    lunchDays: text("lunch_days"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "user_preferences_campus_coordinates_check",
      sql`(${table.campusLatitude} is null and ${table.campusLongitude} is null) or (${table.campusLatitude} is not null and ${table.campusLongitude} is not null and ${table.campusLatitude} between -90 and 90 and ${table.campusLongitude} between -180 and 180)`,
    ),
    check(
      "user_preferences_lunch_start_time_check",
      sql`${table.lunchStartTime} is null or (length(${table.lunchStartTime}) = 5 and (substr(${table.lunchStartTime}, 1, 2) glob '[01][0-9]' or substr(${table.lunchStartTime}, 1, 2) glob '2[0-3]') and substr(${table.lunchStartTime}, 3, 1) = ':' and substr(${table.lunchStartTime}, 4, 2) glob '[0-5][0-9]')`,
    ),
    check(
      "user_preferences_lunch_end_time_check",
      sql`${table.lunchEndTime} is null or (length(${table.lunchEndTime}) = 5 and (substr(${table.lunchEndTime}, 1, 2) glob '[01][0-9]' or substr(${table.lunchEndTime}, 1, 2) glob '2[0-3]') and substr(${table.lunchEndTime}, 3, 1) = ':' and substr(${table.lunchEndTime}, 4, 2) glob '[0-5][0-9]')`,
    ),
    check(
      "user_preferences_lunch_time_order_check",
      sql`${table.lunchStartTime} is null or ${table.lunchEndTime} is null or ${table.lunchStartTime} < ${table.lunchEndTime}`,
    ),
  ],
);

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
      sql`${table.status} IN ('pending', 'processing', 'completed', 'failed')`,
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
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("recommendation_categories_batch_id_category_unique").on(
      table.batchId,
      table.category,
    ),
    unique("recommendation_categories_id_batch_id_unique").on(
      table.id,
      table.batchId,
    ),
    check(
      "recommendation_categories_category_check",
      sql`${table.category} IN ('居酒屋', 'ダイニングバー・バル', '創作料理', '和食', '洋食', 'イタリアン・フレンチ', '中華', '焼肉・ホルモン', '韓国料理', 'アジア・エスニック料理', '各国料理', 'カラオケ・パーティ', 'バー・カクテル', 'ラーメン', 'お好み焼き・もんじゃ', 'カフェ・スイーツ', 'その他グルメ')`,
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

/** Google Placesから取得した店舗画像URLを複数保持するテーブル。 */
export const restaurantPhotos = sqliteTable(
  "restaurant_photos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    photoUrl: text("photo_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("restaurant_photos_restaurant_id_photo_url_unique").on(
      table.restaurantId,
      table.photoUrl,
    ),
  ],
);

/** Google Placesから取得した店舗ごとの料金レンジを保持するテーブル。 */
export const restaurantPriceRanges = sqliteTable(
  "restaurant_price_ranges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    restaurantId: text("restaurant_id")
      .notNull()
      .unique()
      .references(() => restaurants.id, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    currencyCode: text("currency_code").notNull(),
    startPrice: integer("start_price").notNull(),
    endPrice: integer("end_price"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "restaurant_price_ranges_start_price_check",
      sql`${table.startPrice} >= 0`,
    ),
    check(
      "restaurant_price_ranges_end_price_check",
      sql`${table.endPrice} is null or ${table.endPrice} > ${table.startPrice}`,
    ),
  ],
);

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
    campusToRestaurantSeconds: integer(
      "campus_to_restaurant_seconds",
    ).notNull(),
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
    uniqueIndex("recommendations_category_id_restaurant_id_unique").on(
      table.recommendationCategoryId,
      table.restaurantId,
    ),
    check(
      "recommendations_distance_group_check",
      sql`${table.distanceGroup} IN ('near', 'middle', 'far')`,
    ),
    check(
      "recommendations_distance_meters_check",
      sql`${table.distanceMeters} >= 0`,
    ),
    check(
      "recommendations_campus_to_restaurant_seconds_check",
      sql`${table.campusToRestaurantSeconds} >= 0`,
    ),
  ],
);
