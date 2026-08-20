import { drizzle } from "drizzle-orm/d1";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import * as schema from "./schema";

let schemaInitialization: Promise<void> | null = null;

export async function ensureQuoteSchema() {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  if (!schemaInitialization) {
    schemaInitialization = DB.batch([
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
        FOREIGN KEY (quote_id) REFERENCES quote_requests(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS group_orders_access_code_unique ON group_orders (access_code)"),
      DB.prepare("CREATE INDEX IF NOT EXISTS group_orders_quote_id_idx ON group_orders (quote_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        group_id INTEGER NOT NULL,
        edit_token TEXT NOT NULL,
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
        FOREIGN KEY (participant_id) REFERENCES participants(id)
      )`),
      DB.prepare("CREATE INDEX IF NOT EXISTS order_items_participant_id_idx ON order_items (participant_id)"),
      DB.prepare(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        group_id INTEGER NOT NULL,
        participant_id INTEGER,
        reference TEXT NOT NULL,
        method TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        validated_at TEXT DEFAULT '' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (group_id) REFERENCES group_orders(id),
        FOREIGN KEY (participant_id) REFERENCES participants(id)
      )`),
      DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_unique ON payments (reference)"),
      DB.prepare("CREATE INDEX IF NOT EXISTS payments_group_id_idx ON payments (group_id)"),
    ]).then(async () => {
      const columnResult = await DB.prepare("PRAGMA table_info(order_items)").all<{ name: string }>();
      const columnNames = new Set((columnResult.results || []).map(column => column.name));
      const additions = [];
      if (!columnNames.has("front_detail")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN front_detail TEXT DEFAULT '' NOT NULL"));
      if (!columnNames.has("sleeve_detail")) additions.push(DB.prepare("ALTER TABLE order_items ADD COLUMN sleeve_detail TEXT DEFAULT '' NOT NULL"));
      if (additions.length) await DB.batch(additions);
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
