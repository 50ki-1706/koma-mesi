CREATE TABLE `genre` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recommendation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`genre_id` integer NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`photo_url` text NOT NULL,
	`price_yen` integer NOT NULL,
	`platform_url` text NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON UPDATE no action ON DELETE cascade
);
