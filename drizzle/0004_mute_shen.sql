CREATE UNIQUE INDEX `product_colors_unique` ON `product_colors` (`product_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_extras_unique` ON `product_extras` (`product_id`,`extra_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_price_tiers_unique` ON `product_price_tiers` (`product_id`,`min_quantity`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_sizes_unique` ON `product_sizes` (`product_id`,`name`);