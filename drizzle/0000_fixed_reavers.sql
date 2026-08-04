CREATE TABLE `cloud_saves` (
	`token` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cloud_saves_updated` ON `cloud_saves` (`updated_at`);--> statement-breakpoint
CREATE TABLE `multiplayer_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_code` text NOT NULL,
	`device_id` text NOT NULL,
	`player_name` text NOT NULL,
	`village` text NOT NULL,
	`x` integer DEFAULT 6 NOT NULL,
	`y` integer DEFAULT 5 NOT NULL,
	`day` integer DEFAULT 1 NOT NULL,
	`hour` integer DEFAULT 7 NOT NULL,
	`energy` integer DEFAULT 100 NOT NULL,
	`sick` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_multiplayer_room_device` ON `multiplayer_players` (`room_code`,`device_id`);--> statement-breakpoint
CREATE INDEX `idx_multiplayer_room_updated` ON `multiplayer_players` (`room_code`,`updated_at`);