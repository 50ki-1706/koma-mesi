PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`recommendation_category_id` text NOT NULL,
	`restaurant_id` text NOT NULL,
	`distance_group` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`recommendation_category_id`,`batch_id`) REFERENCES `recommendation_categories`(`id`,`batch_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recommendations_distance_group_check" CHECK("__new_recommendations"."distance_group" in ('near', 'middle', 'far')),
	CONSTRAINT "recommendations_distance_meters_check" CHECK("__new_recommendations"."distance_meters" >= 0),
	CONSTRAINT "recommendations_duration_minutes_check" CHECK("__new_recommendations"."duration_minutes" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_recommendations`("id", "batch_id", "recommendation_category_id", "restaurant_id", "distance_group", "distance_meters", "duration_minutes", "created_at") SELECT "id", "batch_id", "recommendation_category_id", "restaurant_id", "distance_group", "distance_meters", 0, "created_at" FROM `recommendations`;--> statement-breakpoint
DROP TABLE `recommendations`;--> statement-breakpoint
ALTER TABLE `__new_recommendations` RENAME TO `recommendations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_distance_group_unique` ON `recommendations` (`recommendation_category_id`,`distance_group`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_category_id_restaurant_id_unique` ON `recommendations` (`recommendation_category_id`,`restaurant_id`);