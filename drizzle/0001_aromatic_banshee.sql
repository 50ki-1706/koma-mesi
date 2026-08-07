CREATE TABLE `recommendation_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendation_batches_status_check" CHECK("recommendation_batches"."status" in ('pending', 'processing', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_batches_user_id_target_date_unique` ON `recommendation_batches` (`user_id`,`target_date`);--> statement-breakpoint
CREATE TABLE `recommendation_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`category` text NOT NULL,
	`selection_order` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `recommendation_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendation_categories_category_check" CHECK("recommendation_categories"."category" in ('居酒屋', 'ダイニングバー・バル', '創作料理', '和食', '洋食', 'イタリアン・フレンチ', '中華', '焼肉・ホルモン', '韓国料理', 'アジア・エスニック料理', '各国料理', 'カラオケ・パーティ', 'バー・カクテル', 'ラーメン', 'お好み焼き・もんじゃ', 'カフェ・スイーツ', 'その他グルメ')),
	CONSTRAINT "recommendation_categories_selection_order_check" CHECK("recommendation_categories"."selection_order" between 1 and 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_batch_id_id_unique` ON `recommendation_categories` (`batch_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_batch_id_category_unique` ON `recommendation_categories` (`batch_id`,`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_batch_id_selection_order_unique` ON `recommendation_categories` (`batch_id`,`selection_order`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`recommendation_category_id` text NOT NULL,
	`restaurant_id` text NOT NULL,
	`distance_group` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`display_order` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`,`recommendation_category_id`) REFERENCES `recommendation_categories`(`batch_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendations_distance_group_check" CHECK("recommendations"."distance_group" in ('near', 'middle', 'far')),
	CONSTRAINT "recommendations_distance_meters_check" CHECK("recommendations"."distance_meters" >= 0),
	CONSTRAINT "recommendations_display_order_check" CHECK("recommendations"."display_order" between 1 and 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_distance_group_unique` ON `recommendations` (`recommendation_category_id`,`distance_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_display_order_unique` ON `recommendations` (`recommendation_category_id`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_restaurant_id_unique` ON `recommendations` (`recommendation_category_id`,`restaurant_id`);--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` text PRIMARY KEY NOT NULL,
	`google_place_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "restaurants_latitude_check" CHECK("restaurants"."latitude" between -90 and 90),
	CONSTRAINT "restaurants_longitude_check" CHECK("restaurants"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurants_google_place_id_unique` ON `restaurants` (`google_place_id`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`campus_address` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);--> statement-breakpoint
DROP TABLE `counter`;--> statement-breakpoint
DROP TABLE `post`;