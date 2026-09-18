-- Correct only the old default Gildan boundary; retain custom catalog prices
-- and every quote/order commercial snapshot.
UPDATE product_price_tiers SET max_quantity = 99
WHERE product_id IN (SELECT id FROM products WHERE slug = 'sudadera-gildan-18500')
  AND min_quantity = 76 AND max_quantity = 100 AND unit_price_cents = 2200;
--> statement-breakpoint
UPDATE product_price_tiers SET min_quantity = 100
WHERE product_id IN (SELECT id FROM products WHERE slug = 'sudadera-gildan-18500')
  AND min_quantity = 101 AND max_quantity IS NULL AND unit_price_cents IS NULL
  AND NOT EXISTS (SELECT 1 FROM product_price_tiers AS existing
    WHERE existing.product_id = product_price_tiers.product_id AND existing.min_quantity = 100);
