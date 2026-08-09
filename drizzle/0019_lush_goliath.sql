PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`campus_address` text NOT NULL,
	`campus_latitude` real,
	`campus_longitude` real,
	`lunch_start_time` text,
	`lunch_end_time` text,
	`lunch_days` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_preferences_campus_coordinates_check" CHECK(("__new_user_preferences"."campus_latitude" is null and "__new_user_preferences"."campus_longitude" is null) or ("__new_user_preferences"."campus_latitude" is not null and "__new_user_preferences"."campus_longitude" is not null and "__new_user_preferences"."campus_latitude" between -90 and 90 and "__new_user_preferences"."campus_longitude" between -180 and 180)),
	CONSTRAINT "user_preferences_lunch_start_time_check" CHECK("__new_user_preferences"."lunch_start_time" is null or (length("__new_user_preferences"."lunch_start_time") = 5 and (substr("__new_user_preferences"."lunch_start_time", 1, 2) glob '[01][0-9]' or substr("__new_user_preferences"."lunch_start_time", 1, 2) glob '2[0-3]') and substr("__new_user_preferences"."lunch_start_time", 3, 1) = ':' and substr("__new_user_preferences"."lunch_start_time", 4, 2) glob '[0-5][0-9]')),
	CONSTRAINT "user_preferences_lunch_end_time_check" CHECK("__new_user_preferences"."lunch_end_time" is null or (length("__new_user_preferences"."lunch_end_time") = 5 and (substr("__new_user_preferences"."lunch_end_time", 1, 2) glob '[01][0-9]' or substr("__new_user_preferences"."lunch_end_time", 1, 2) glob '2[0-3]') and substr("__new_user_preferences"."lunch_end_time", 3, 1) = ':' and substr("__new_user_preferences"."lunch_end_time", 4, 2) glob '[0-5][0-9]')),
	CONSTRAINT "user_preferences_lunch_time_order_check" CHECK("__new_user_preferences"."lunch_start_time" is null or "__new_user_preferences"."lunch_end_time" is null or "__new_user_preferences"."lunch_start_time" < "__new_user_preferences"."lunch_end_time")
);
--> statement-breakpoint
INSERT INTO `__new_user_preferences`("id", "user_id", "campus_address", "campus_latitude", "campus_longitude", "lunch_start_time", "lunch_end_time", "lunch_days", "created_at", "updated_at") SELECT "id", "user_id", "campus_address", "campus_latitude", "campus_longitude", "lunch_start_time", "lunch_end_time", "lunch_days", "created_at", "updated_at" FROM `user_preferences`;--> statement-breakpoint
DROP TABLE `user_preferences`;--> statement-breakpoint
ALTER TABLE `__new_user_preferences` RENAME TO `user_preferences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);