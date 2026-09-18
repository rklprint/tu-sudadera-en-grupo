import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function applyMigrations(database) {
  const migrationDirectory = join(repoRoot, "drizzle");
  const migrations = readdirSync(migrationDirectory)
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();

  for (const migration of migrations) {
    const sql = readFileSync(join(migrationDirectory, migration), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) database.exec(statement);
    }
  }
}

function normalize(value) {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value) && !Buffer.isBuffer(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return value;
}

function normalizeRow(row) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalize(value)]));
}

class D1TestStatement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) { return new D1TestStatement(this.database, this.sql, values.map(normalize)); }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid || 0) } };
  }

  async all() {
    const results = this.database.prepare(this.sql).all(...this.values).map(normalizeRow);
    return { success: true, results, meta: { changes: 0 } };
  }

  async first(column) {
    const row = normalizeRow(this.database.prepare(this.sql).get(...this.values));
    return column ? row?.[column] ?? null : row ?? null;
  }

  async raw(options = {}) {
    const statement = this.database.prepare(this.sql);
    const rows = statement.all(...this.values);
    const columns = rows.length ? Object.keys(rows[0]) : [];
    const values = rows.map((row) => columns.map((column) => normalize(row[column])));
    return options.columnNames ? [columns, ...values] : values;
  }
}

export class D1TestDatabase {
  constructor() {
    this.database = new DatabaseSync(":memory:");
    this.database.exec("PRAGMA foreign_keys = ON");
    applyMigrations(this.database);
    this.batchQueue = Promise.resolve();
  }

  prepare(sql) { return new D1TestStatement(this.database, sql); }

  async batch(statements) {
    const operation = this.batchQueue.then(async () => {
      this.database.exec("BEGIN IMMEDIATE");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        this.database.exec("COMMIT");
        return results;
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    });
    this.batchQueue = operation.catch(() => undefined);
    return operation;
  }

  async exec(sql) {
    this.database.exec(sql);
    return { count: 1, duration: 0 };
  }

  query(sql, ...values) { return normalizeRow(this.database.prepare(sql).get(...values.map(normalize))); }
  queryAll(sql, ...values) { return this.database.prepare(sql).all(...values.map(normalize)).map(normalizeRow); }
  execute(sql, ...values) { return this.database.prepare(sql).run(...values.map(normalize)); }
  close() { this.database.close(); }
}

export class R2TestBucket {
  constructor() { this.objects = new Map(); }

  async put(key, value, options = {}) {
    const bytes = value instanceof ReadableStream
      ? new Uint8Array(await new Response(value).arrayBuffer())
      : new Uint8Array(value instanceof ArrayBuffer ? value : Buffer.from(String(value)));
    this.objects.set(key, { bytes, ...options });
    return {};
  }

  async get(key) {
    const object = this.objects.get(key);
    if (!object) return null;
    return {
      body: new Blob([object.bytes]).stream(),
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata,
    };
  }

  async delete(key) { this.objects.delete(key); }
}
