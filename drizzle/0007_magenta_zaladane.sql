ALTER TABLE `payments` ADD `active_scope_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_active_scope_key_unique` ON `payments` (`active_scope_key`);--> statement-breakpoint
CREATE INDEX `participants_edit_token_hash_idx` ON `participants` (`edit_token_hash`);--> statement-breakpoint
CREATE TRIGGER `payments_block_remaining_while_active`
BEFORE INSERT ON `payments`
WHEN NEW.participant_id IS NULL
  AND NEW.status IN ('pending', 'processing')
  AND EXISTS (SELECT 1 FROM payments WHERE group_id = NEW.group_id AND status IN ('pending', 'processing'))
BEGIN SELECT RAISE(ABORT, 'active group payments'); END;--> statement-breakpoint
CREATE TRIGGER `payments_block_participant_while_remaining`
BEFORE INSERT ON `payments`
WHEN NEW.participant_id IS NOT NULL
  AND NEW.status IN ('pending', 'processing')
  AND EXISTS (SELECT 1 FROM payments WHERE group_id = NEW.group_id AND participant_id IS NULL AND status IN ('pending', 'processing'))
BEGIN SELECT RAISE(ABORT, 'active remaining payment'); END;
