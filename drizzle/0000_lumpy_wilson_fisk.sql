CREATE TABLE `quote_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`organizer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`group_type` text NOT NULL,
	`location` text NOT NULL,
	`quantity` integer NOT NULL,
	`desired_date` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`reference_url` text DEFAULT '' NOT NULL,
	`configuration_json` text DEFAULT '{}' NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quote_requests_code_unique` ON `quote_requests` (`code`);