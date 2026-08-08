CREATE TABLE `restaurant_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`photo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_photos_restaurant_id_photo_url_unique` ON `restaurant_photos` (`restaurant_id`,`photo_url`);--> statement-breakpoint
CREATE TABLE `restaurant_price_ranges` (
	`id` text PRIMARY KEY NOT NULL,
	`restaurant_id` text NOT NULL,
	`currency_code` text NOT NULL,
	`start_price` integer NOT NULL,
	`end_price` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "restaurant_price_ranges_start_price_check" CHECK("restaurant_price_ranges"."start_price" >= 0),
	CONSTRAINT "restaurant_price_ranges_end_price_check" CHECK("restaurant_price_ranges"."end_price" is null or "restaurant_price_ranges"."end_price" > "restaurant_price_ranges"."start_price")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `restaurant_price_ranges_restaurant_id_unique` ON `restaurant_price_ranges` (`restaurant_id`);