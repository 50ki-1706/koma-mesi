PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_batch_id_category_unique` ON `recommendation_categories` (`batch_id`,`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_categories_id_batch_id_unique` ON `recommendation_categories` (`id`,`batch_id`);