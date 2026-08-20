CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_id` integer NOT NULL,
	`status` text DEFAULT 'not_requested' NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`requested_at` text DEFAULT '' NOT NULL,
	`issued_at` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_payment_id_unique` ON `invoices` (`payment_id`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_id` integer NOT NULL,
	`provider` text NOT NULL,
	`event_key` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`processed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_event_key_unique` ON `payment_events` (`event_key`);--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipping_recipient` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipping_postal_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipping_city` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipping_province` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipping_country` text DEFAULT 'España' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `carrier` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `tracking_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `shipped_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `delivered_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `group_orders` ADD `private_link_revoked_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `provider` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `merchant_order` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `provider_transaction_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `response_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `callback_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_merchant_order_unique` ON `payments` (`merchant_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_key_unique` ON `payments` (`idempotency_key`);