-- Promote only the unpriced provisional t-shirt. Never rewrite managed prices,
-- removed variants, or historical quote/order snapshots.
CREATE TABLE __tsg_0011_targets (product_id INTEGER PRIMARY KEY);
--> statement-breakpoint
INSERT INTO __tsg_0011_targets
SELECT id FROM products p
WHERE slug = 'camiseta-personalizada' AND category = 'tshirt'
  AND model = 'Modelo por confirmar' AND quote_only = 1
  AND NOT EXISTS (SELECT 1 FROM product_price_tiers t WHERE t.product_id = p.id);
--> statement-breakpoint
INSERT INTO product_price_tiers (product_id, min_quantity, max_quantity, unit_price_cents, position)
SELECT target.product_id, tier.min_qty, tier.max_qty, tier.cents, tier.position
FROM __tsg_0011_targets target CROSS JOIN (
  SELECT 5 AS min_qty, 10 AS max_qty, 1500 AS cents, 1 AS position
  UNION ALL SELECT 11, 20, 1300, 2
  UNION ALL SELECT 21, 30, 1100, 3
  UNION ALL SELECT 31, 40, 950, 4
  UNION ALL SELECT 41, 50, 900, 5
  UNION ALL SELECT 51, 75, 850, 6
  UNION ALL SELECT 76, 99, 800, 7
  UNION ALL SELECT 100, NULL, NULL, 8
) tier;
--> statement-breakpoint
INSERT OR IGNORE INTO product_extras (product_id, extra_id)
SELECT target.product_id, e.id FROM __tsg_0011_targets target CROSS JOIN extras e
WHERE e.slug IN ('manga-dtf', 'manga-bandera-bordada', 'pecho-coordenadas-bordadas', 'pecho-logo-bordado', 'manga-logo-bordado');
--> statement-breakpoint
UPDATE products SET model = 'Gildan 2000', quote_only = 0,
  description = 'Ultra Cotton unisex para grupos. DTF pecho, espalda y nombre incluidos.',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT product_id FROM __tsg_0011_targets);
--> statement-breakpoint
DROP TABLE __tsg_0011_targets;
