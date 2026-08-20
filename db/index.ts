import { drizzle } from "drizzle-orm/d1";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { CORE_COLORS, CORE_SIZES, HOODIE_PRICE_TIERS } from "@/lib/catalog";
import * as schema from "./schema";

let schemaInitialization: Promise<void> | null = null;

export async function ensureQuoteSchema() {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  if (!schemaInitialization) {
    schemaInitialization = DB.batch([
      DB.prepare(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        category TEXT NOT NULL,
        model TEXT NOT NULL,
        description TEXT DEFAULT '' NOT NULL,
        images_json TEXT DEFAULT '[]' NOT NULL,
        personalization_type TEXT DEFAULT 'dtf' NOT NULL,
        quote_only INTEGER DEFAULT 0 NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        featured INTEGER DEFAULT 0 NOT NULL,
        position INTEGER DEFAULT 0 NOT NULL,
        seo_title TEXT DEFAULT '' NOT NULL,
        seo_description TEXT DEFAULT '' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products (slug)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS product_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        product_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        hex TEXT NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        position INTEGER DEFAULT 0 NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`),
      DB.prepare("CREATE INDEX IF NOT EXISTS product_colors_product_id_idx ON product_colors (product_id)"),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS product_colors_unique ON product_colors (product_id, name)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS product_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        product_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        position INTEGER DEFAULT 0 NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`),
      DB.prepare("CREATE INDEX IF NOT EXISTS product_sizes_product_id_idx ON product_sizes (product_id)"),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS product_sizes_unique ON product_sizes (product_id, name)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS product_price_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        product_id INTEGER NOT NULL,
        min_quantity INTEGER NOT NULL,
        max_quantity INTEGER,
        unit_price_cents INTEGER,
        position INTEGER DEFAULT 0 NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`),
      DB.prepare("CREATE INDEX IF NOT EXISTS product_price_tiers_product_id_idx ON product_price_tiers (product_id)"),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS product_price_tiers_unique ON product_price_tiers (product_id, min_quantity)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS extras (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT DEFAULT '' NOT NULL,
        placement TEXT DEFAULT 'other' NOT NULL,
        technique TEXT DEFAULT 'other' NOT NULL,
        price_cents INTEGER,
        quote_only INTEGER DEFAULT 0 NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        position INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS extras_slug_unique ON extras (slug)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS product_extras (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        product_id INTEGER NOT NULL,
        extra_id INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (extra_id) REFERENCES extras(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS product_extras_unique ON product_extras (product_id, extra_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS quote_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        code TEXT NOT NULL,
        status TEXT DEFAULT 'received' NOT NULL,
        organizer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT DEFAULT '' NOT NULL,
        group_type TEXT NOT NULL,
        location TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        desired_date TEXT DEFAULT '' NOT NULL,
        notes TEXT DEFAULT '' NOT NULL,
        reference_url TEXT DEFAULT '' NOT NULL,
        configuration_json TEXT DEFAULT '{}' NOT NULL,
        email_status TEXT DEFAULT 'pending' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_code_unique ON quote_requests (code)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS group_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        quote_id INTEGER,
        access_code TEXT NOT NULL,
        group_name TEXT NOT NULL,
        organizer_name TEXT NOT NULL,
        organizer_email TEXT NOT NULL,
        organizer_phone TEXT NOT NULL,
        product_id INTEGER,
        product_type TEXT DEFAULT 'hoodie' NOT NULL,
        garment TEXT DEFAULT 'Gildan 18500' NOT NULL,
        color TEXT NOT NULL,
        estimated_quantity INTEGER NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        design_status TEXT DEFAULT 'review' NOT NULL,
        registration_status TEXT DEFAULT 'open' NOT NULL,
        payment_status TEXT DEFAULT 'locked' NOT NULL,
        production_status TEXT DEFAULT 'planning' NOT NULL,
        deadline TEXT DEFAULT '' NOT NULL,
        shipping_address TEXT DEFAULT '' NOT NULL,
        configuration_json TEXT DEFAULT '{}' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (quote_id) REFERENCES quote_requests(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS group_orders_access_code_unique ON group_orders (access_code)"),
      DB.prepare("CREATE INDEX IF NOT EXISTS group_orders_quote_id_idx ON group_orders (quote_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        group_id INTEGER NOT NULL,
        edit_token TEXT NOT NULL,
        edit_token_hash TEXT DEFAULT '' NOT NULL,
        edit_token_expires_at TEXT DEFAULT '' NOT NULL,
        edit_token_revoked_at TEXT DEFAULT '' NOT NULL,
        email TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        payment_status TEXT DEFAULT 'unpaid' NOT NULL,
        payment_method TEXT DEFAULT '' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (group_id) REFERENCES group_orders(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS participants_edit_token_unique ON participants (edit_token)"),
      DB.prepare("CREATE INDEX IF NOT EXISTS participants_group_id_idx ON participants (group_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        participant_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT DEFAULT 'Sudadera' NOT NULL,
        model TEXT DEFAULT 'Gildan 18500' NOT NULL,
        color TEXT DEFAULT '' NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        print_name TEXT NOT NULL,
        size TEXT NOT NULL,
        name_placement TEXT DEFAULT 'front' NOT NULL,
        front_extra TEXT DEFAULT 'none' NOT NULL,
        front_detail TEXT DEFAULT '' NOT NULL,
        sleeve_extra TEXT DEFAULT 'none' NOT NULL,
        sleeve_detail TEXT DEFAULT '' NOT NULL,
        extras_cents INTEGER DEFAULT 0 NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (participant_id) REFERENCES participants(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`),
      DB.prepare("CREATE INDEX IF NOT EXISTS order_items_participant_id_idx ON order_items (participant_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        group_id INTEGER NOT NULL,
        participant_id INTEGER,
        reference TEXT NOT NULL,
        method TEXT NOT NULL,
        provider TEXT DEFAULT 'manual' NOT NULL,
        merchant_order TEXT,
        idempotency_key TEXT,
        active_scope_key TEXT,
        provider_transaction_id TEXT DEFAULT '' NOT NULL,
        amount_cents INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        response_code TEXT DEFAULT '' NOT NULL,
        callback_hash TEXT DEFAULT '' NOT NULL,
        validated_at TEXT DEFAULT '' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (group_id) REFERENCES group_orders(id),
        FOREIGN KEY (participant_id) REFERENCES participants(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_unique ON payments (reference)"),
      DB.prepare("CREATE INDEX IF NOT EXISTS payments_group_id_idx ON payments (group_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS payment_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        payment_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        event_key TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        processed_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payment_events_event_key_unique ON payment_events (event_key)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        payment_id INTEGER NOT NULL,
        status TEXT DEFAULT 'not_requested' NOT NULL,
        invoice_number TEXT DEFAULT '' NOT NULL,
        requested_at TEXT DEFAULT '' NOT NULL,
        issued_at TEXT DEFAULT '' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS invoices_payment_id_unique ON invoices (payment_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'admin' NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_unique ON admin_users (email)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
    ]).then(async () => {
      const columnResult = await DB.prepare("PRAGMA table_info(order_items)").all<{ name: string }>();
      const columnNames = new Set((columnResult.results || []).map((column: { name: string }) => column.name));
      const groupColumnResult = await DB.prepare("PRAGMA table_info(group_orders)").all<{ name: string }>();
      const groupColumnNames = new Set((groupColumnResult.results || []).map((column: { name: string }) => column.name));
      const paymentColumnResult = await DB.prepare("PRAGMA table_info(payments)").all<{ name: string }>();
      const paymentColumnNames = new Set((paymentColumnResult.results || []).map((column: { name: string }) => column.name));
      const participantColumnResult = await DB.prepare("PRAGMA table_info(participants)").all<{ name: string }>();
      const participantColumnNames = new Set((participantColumnResult.results || []).map((column: { name: string }) => column.name));
      const additions = [];
      if (!columnNames.has("front_detail")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN front_detail TEXT DEFAULT '' NOT NULL"));
      if (!columnNames.has("sleeve_detail")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN sleeve_detail TEXT DEFAULT '' NOT NULL"));
      if (!columnNames.has("product_id")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN product_id INTEGER"));
      if (!columnNames.has("product_name")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN product_name TEXT DEFAULT 'Sudadera' NOT NULL"));
      if (!columnNames.has("model")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN model TEXT DEFAULT 'Gildan 18500' NOT NULL"));
      if (!columnNames.has("color")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN color TEXT DEFAULT '' NOT NULL"));
      if (!columnNames.has("quantity")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN quantity INTEGER DEFAULT 1 NOT NULL"));
      if (!groupColumnNames.has("product_id")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN product_id INTEGER"));
      if (!groupColumnNames.has("product_type")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN product_type TEXT DEFAULT 'hoodie' NOT NULL"));
      if (!groupColumnNames.has("shipping_recipient")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipping_recipient TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("shipping_postal_code")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipping_postal_code TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("shipping_city")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipping_city TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("shipping_province")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipping_province TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("shipping_country")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipping_country TEXT DEFAULT 'España' NOT NULL"));
      if (!groupColumnNames.has("carrier")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN carrier TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("tracking_code")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN tracking_code TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("shipped_at")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN shipped_at TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("delivered_at")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN delivered_at TEXT DEFAULT '' NOT NULL"));
      if (!groupColumnNames.has("private_link_revoked_at")) additions.push(DB.prepare("ALTER TABLE group_orders ADD COLUMN private_link_revoked_at TEXT DEFAULT '' NOT NULL"));
      if (!paymentColumnNames.has("provider")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN provider TEXT DEFAULT 'manual' NOT NULL"));
      if (!paymentColumnNames.has("merchant_order")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN merchant_order TEXT"));
      if (!paymentColumnNames.has("idempotency_key")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN idempotency_key TEXT"));
      if (!paymentColumnNames.has("active_scope_key")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN active_scope_key TEXT"));
      if (!paymentColumnNames.has("provider_transaction_id")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN provider_transaction_id TEXT DEFAULT '' NOT NULL"));
      if (!paymentColumnNames.has("response_code")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN response_code TEXT DEFAULT '' NOT NULL"));
      if (!paymentColumnNames.has("callback_hash")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN callback_hash TEXT DEFAULT '' NOT NULL"));
      if (!paymentColumnNames.has("updated_at")) additions.push(DB.prepare("ALTER TABLE payments ADD COLUMN updated_at TEXT DEFAULT '' NOT NULL"));
      if (!participantColumnNames.has("edit_token_hash")) additions.push(DB.prepare("ALTER TABLE participants ADD COLUMN edit_token_hash TEXT DEFAULT '' NOT NULL"));
      if (!participantColumnNames.has("edit_token_expires_at")) additions.push(DB.prepare("ALTER TABLE participants ADD COLUMN edit_token_expires_at TEXT DEFAULT '' NOT NULL"));
      if (!participantColumnNames.has("edit_token_revoked_at")) additions.push(DB.prepare("ALTER TABLE participants ADD COLUMN edit_token_revoked_at TEXT DEFAULT '' NOT NULL"));
      if (additions.length) await DB.batch(additions);
      await DB.batch([
        DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payments_merchant_order_unique ON payments (merchant_order)"),
        DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_unique ON payments (idempotency_key)"),
        DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payments_active_scope_key_unique ON payments (active_scope_key)"),
        DB.prepare("CREATE INDEX IF NOT EXISTS participants_edit_token_hash_idx ON participants (edit_token_hash)"),
        DB.prepare(`CREATE TRIGGER IF NOT EXISTS payments_block_remaining_while_active
          BEFORE INSERT ON payments
          WHEN NEW.participant_id IS NULL
            AND NEW.status IN ('pending', 'processing')
            AND EXISTS (SELECT 1 FROM payments WHERE group_id = NEW.group_id AND status IN ('pending', 'processing'))
          BEGIN SELECT RAISE(ABORT, 'active group payments'); END`),
        DB.prepare(`CREATE TRIGGER IF NOT EXISTS payments_block_participant_while_remaining
          BEFORE INSERT ON payments
          WHEN NEW.participant_id IS NOT NULL
            AND NEW.status IN ('pending', 'processing')
            AND EXISTS (SELECT 1 FROM payments WHERE group_id = NEW.group_id AND participant_id IS NULL AND status IN ('pending', 'processing'))
          BEGIN SELECT RAISE(ABORT, 'active remaining payment'); END`),
      ]);
      await seedCatalog(DB);
    }).catch((error: unknown) => {
      schemaInitialization = null;
      throw error;
    });
  }

  await schemaInitialization;
}

export function getDb() {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(DB, { schema });
}

async function seedCatalog(DB: NonNullable<ReturnType<typeof getSiteRuntimeEnv>["DB"]>) {
  await DB.batch([
    DB.prepare(`INSERT OR IGNORE INTO products (name, slug, category, model, description, quote_only, active, featured, position)
      VALUES ('Sudadera personalizada', 'sudadera-gildan-18500', 'hoodie', 'Gildan 18500', 'Heavy Blend unisex para grupos.', 0, 1, 1, 1)`),
    DB.prepare(`INSERT OR IGNORE INTO products (name, slug, category, model, description, quote_only, active, featured, position)
      VALUES ('Camiseta personalizada', 'camiseta-personalizada', 'tshirt', 'Modelo por confirmar', 'Producto secundario pendiente de modelo y tarifa definitivos.', 1, 1, 0, 2)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Bandera o logo en manga · DTF', 'manga-dtf', 'Impresión adicional en manga.', 'sleeve', 'dtf', 100, 0, 1, 1)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Bandera de país o comunidad · bordada', 'manga-bandera-bordada', 'Bandera bordada en manga.', 'sleeve', 'embroidery', 200, 0, 1, 2)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Coordenadas en pecho · bordadas', 'pecho-coordenadas-bordadas', 'Coordenadas bordadas en pecho.', 'front', 'embroidery', 100, 0, 1, 3)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Logo propio bordado · pecho', 'pecho-logo-bordado', 'Precio según tamaño, puntadas y complejidad.', 'front', 'embroidery', NULL, 1, 1, 4)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Logo propio bordado · manga', 'manga-logo-bordado', 'Precio según tamaño, puntadas y complejidad.', 'sleeve', 'embroidery', NULL, 1, 1, 5)`),
  ]);

  const productRows = await DB.prepare("SELECT id, slug FROM products WHERE slug IN ('sudadera-gildan-18500', 'camiseta-personalizada')").all<{ id: number; slug: string }>();
  const productIds = new Map((productRows.results || []).map((row: { id: number; slug: string }) => [row.slug, row.id]));
  const hoodieId = productIds.get("sudadera-gildan-18500");
  const tshirtId = productIds.get("camiseta-personalizada");
  if (!hoodieId || !tshirtId) return;

  const variants = [hoodieId, tshirtId].flatMap((productId) => [
    ...CORE_COLORS.map((color, position) => DB.prepare("INSERT OR IGNORE INTO product_colors (product_id, name, hex, position) VALUES (?, ?, ?, ?)").bind(productId, color.name, color.value, position + 1)),
    ...CORE_SIZES.map((size, position) => DB.prepare("INSERT OR IGNORE INTO product_sizes (product_id, name, position) VALUES (?, ?, ?)").bind(productId, size, position + 1)),
  ]);
  const tiers = HOODIE_PRICE_TIERS.map((tier, position) => DB.prepare("INSERT OR IGNORE INTO product_price_tiers (product_id, min_quantity, max_quantity, unit_price_cents, position) VALUES (?, ?, ?, ?, ?)").bind(hoodieId, tier.min, tier.max, tier.unitPriceCents, position + 1));
  await DB.batch([...variants, ...tiers]);

  await DB.prepare(`INSERT OR IGNORE INTO product_extras (product_id, extra_id)
    SELECT ?, id FROM extras WHERE active = 1`).bind(hoodieId).run();
}
