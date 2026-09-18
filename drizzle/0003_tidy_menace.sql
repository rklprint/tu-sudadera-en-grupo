CREATE TABLE `extras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`placement` text DEFAULT 'other' NOT NULL,
	`technique` text DEFAULT 'other' NOT NULL,
	`price_cents` integer,
	`quote_only` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extras_slug_unique` ON `extras` (`slug`);--> statement-breakpoint
CREATE TABLE `product_colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`hex` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_extras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`extra_id` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`extra_id`) REFERENCES `extras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_price_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`min_quantity` integer NOT NULL,
	`max_quantity` integer,
	`unit_price_cents` integer,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`model` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`images_json` text DEFAULT '[]' NOT NULL,
	`personalization_type` text DEFAULT 'dtf' NOT NULL,
	`quote_only` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`seo_title` text DEFAULT '' NOT NULL,
	`seo_description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
ALTER TABLE `group_orders` ADD `product_id` integer REFERENCES products(id);--> statement-breakpoint
ALTER TABLE `group_orders` ADD `product_type` text DEFAULT 'hoodie' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `product_id` integer REFERENCES products(id);--> statement-breakpoint
ALTER TABLE `order_items` ADD `product_name` text DEFAULT 'Sudadera' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `model` text DEFAULT 'Gildan 18500' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `color` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `quantity` integer DEFAULT 1 NOT NULL;