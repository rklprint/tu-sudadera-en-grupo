ALTER TABLE `participants` ADD `edit_token_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `edit_token_expires_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `edit_token_revoked_at` text DEFAULT '' NOT NULL;