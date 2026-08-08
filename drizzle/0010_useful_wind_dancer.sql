PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recommendation_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendation_batches_status_check" CHECK("__new_recommendation_batches"."status" in ('pending', 'processing', 'completed', 'failed')),
	CONSTRAINT "recommendation_batches_target_date_check" CHECK("__new_recommendation_batches"."target_date" glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
INSERT INTO `__new_recommendation_batches`("id", "user_id", "target_date", "status", "started_at", "completed_at", "created_at") SELECT "id", "user_id", "target_date", "status", "started_at", "completed_at", "created_at" FROM `recommendation_batches`;--> statement-breakpoint
DROP TABLE `recommendation_batches`;--> statement-breakpoint
ALTER TABLE `__new_recommendation_batches` RENAME TO `recommendation_batches`;--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_batches_user_id_target_date_unique` ON `recommendation_batches` (`user_id`,`target_date`);--> statement-breakpoint
CREATE TABLE `__new_recommendation_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `recommendation_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendation_categories_category_check" CHECK("__new_recommendation_categories"."category" in ('居酒屋', 'ダイニングバー・バル', '創作料理', '和食', '洋食', 'イタリアン・フレンチ', '中華', '焼肉・ホルモン', '韓国料理', 'アジア・エスニック料理', '各国料理', 'カラオケ・パーティ', 'バー・カクテル', 'ラーメン', 'お好み焼き・もんじゃ', 'カフェ・スイーツ', 'その他グルメ'))
);
--> statement-breakpoint
INSERT INTO `__new_recommendation_categories`("id", "batch_id", "category", "created_at") SELECT "id", "batch_id", "category", "created_at" FROM `recommendation_categories`;--> statement-breakpoint
DROP TABLE `recommendation_categories`;--> statement-breakpoint
ALTER TABLE `__new_recommendation_categories` RENAME TO `recommendation_categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_batch_id_category_unique` ON `recommendation_categories` (`batch_id`,`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_id_batch_id_unique` ON `recommendation_categories` (`id`,`batch_id`);--> statement-breakpoint
CREATE TABLE `__new_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`recommendation_category_id` text NOT NULL,
	`restaurant_id` text NOT NULL,
	`distance_group` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`recommendation_category_id`,`batch_id`) REFERENCES `recommendation_categories`(`id`,`batch_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendations_distance_group_check" CHECK("__new_recommendations"."distance_group" in ('near', 'middle', 'far')),
	CONSTRAINT "recommendations_distance_meters_check" CHECK("__new_recommendations"."distance_meters" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_recommendations`("id", "batch_id", "recommendation_category_id", "restaurant_id", "distance_group", "distance_meters", "created_at") SELECT "id", "batch_id", "recommendation_category_id", "restaurant_id", "distance_group", "distance_meters", "created_at" FROM `recommendations`;--> statement-breakpoint
DROP TABLE `recommendations`;--> statement-breakpoint
ALTER TABLE `__new_recommendations` RENAME TO `recommendations`;--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_distance_group_unique` ON `recommendations` (`recommendation_category_id`,`distance_group`);--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint