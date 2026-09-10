CREATE TABLE `group_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer,
	`access_code` text NOT NULL,
	`group_name` text NOT NULL,
	`organizer_name` text NOT NULL,
	`organizer_email` text NOT NULL,
	`organizer_phone` text NOT NULL,
	`garment` text DEFAULT 'Gildan 18500' NOT NULL,
	`color` text NOT NULL,
	`estimated_quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`design_status` text DEFAULT 'review' NOT NULL,
	`registration_status` text DEFAULT 'open' NOT NULL,
	`payment_status` text DEFAULT 'locked' NOT NULL,
	`production_status` text DEFAULT 'planning' NOT NULL,
	`deadline` text DEFAULT '' NOT NULL,
	`shipping_address` text DEFAULT '' NOT NULL,
	`configuration_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quote_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_orders_access_code_unique` ON `group_orders` (`access_code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` integer NOT NULL,
	`print_name` text NOT NULL,
	`size` text NOT NULL,
	`name_placement` text DEFAULT 'front' NOT NULL,
	`front_extra` text DEFAULT 'none' NOT NULL,
	`sleeve_extra` text DEFAULT 'none' NOT NULL,
	`extras_cents` integer DEFAULT 0 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`edit_token` text NOT NULL,
	`email` text NOT NULL,
	`contact_name` text NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`payment_method` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `group_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_edit_token_unique` ON `participants` (`edit_token`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`participant_id` integer,
	`reference` text NOT NULL,
	`method` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`validated_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `group_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_reference_unique` ON `payments` (`reference`);