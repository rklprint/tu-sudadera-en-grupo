import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  model: text("model").notNull(),
  description: text("description").notNull().default(""),
  imagesJson: text("images_json").notNull().default("[]"),
  personalizationType: text("personalization_type").notNull().default("dtf"),
  quoteOnly: integer("quote_only", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productColors = sqliteTable("product_colors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
}, (table) => [uniqueIndex("product_colors_unique").on(table.productId, table.name)]);

export const productSizes = sqliteTable("product_sizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
}, (table) => [uniqueIndex("product_sizes_unique").on(table.productId, table.name)]);

export const productPriceTiers = sqliteTable("product_price_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  unitPriceCents: integer("unit_price_cents"),
  position: integer("position").notNull().default(0),
}, (table) => [uniqueIndex("product_price_tiers_unique").on(table.productId, table.minQuantity)]);

export const extras = sqliteTable("extras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  placement: text("placement").notNull().default("other"),
  technique: text("technique").notNull().default("other"),
  priceCents: integer("price_cents"),
  quoteOnly: integer("quote_only", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productExtras = sqliteTable("product_extras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  extraId: integer("extra_id").notNull().references(() => extras.id),
}, (table) => [uniqueIndex("product_extras_unique").on(table.productId, table.extraId)]);

export const quoteRequests = sqliteTable("quote_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("received"),
  organizerName: text("organizer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  groupType: text("group_type").notNull(),
  location: text("location").notNull(),
  quantity: integer("quantity").notNull(),
  desiredDate: text("desired_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
  referenceUrl: text("reference_url").notNull().default(""),
  configurationJson: text("configuration_json").notNull().default("{}"),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const groupOrders = sqliteTable("group_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").references(() => quoteRequests.id),
  accessCode: text("access_code").notNull().unique(),
  groupName: text("group_name").notNull(),
  organizerName: text("organizer_name").notNull(),
  organizerEmail: text("organizer_email").notNull(),
  organizerPhone: text("organizer_phone").notNull(),
  productId: integer("product_id").references(() => products.id),
  productType: text("product_type").notNull().default("hoodie"),
  garment: text("garment").notNull().default("Gildan 18500"),
  color: text("color").notNull(),
  estimatedQuantity: integer("estimated_quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  designStatus: text("design_status").notNull().default("review"),
  registrationStatus: text("registration_status").notNull().default("open"),
  paymentStatus: text("payment_status").notNull().default("locked"),
  productionStatus: text("production_status").notNull().default("planning"),
  deadline: text("deadline").notNull().default(""),
  shippingAddress: text("shipping_address").notNull().default(""),
  shippingRecipient: text("shipping_recipient").notNull().default(""),
  shippingPostalCode: text("shipping_postal_code").notNull().default(""),
  shippingCity: text("shipping_city").notNull().default(""),
  shippingProvince: text("shipping_province").notNull().default(""),
  shippingCountry: text("shipping_country").notNull().default("España"),
  carrier: text("carrier").notNull().default(""),
  trackingCode: text("tracking_code").notNull().default(""),
  shippedAt: text("shipped_at").notNull().default(""),
  deliveredAt: text("delivered_at").notNull().default(""),
  privateLinkRevokedAt: text("private_link_revoked_at").notNull().default(""),
  configurationJson: text("configuration_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groupOrders.id),
  editToken: text("edit_token").notNull().unique(),
  editTokenHash: text("edit_token_hash").notNull().default(""),
  editTokenExpiresAt: text("edit_token_expires_at").notNull().default(""),
  editTokenRevokedAt: text("edit_token_revoked_at").notNull().default(""),
  email: text("email").notNull(),
  contactName: text("contact_name").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentMethod: text("payment_method").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  participantId: integer("participant_id").notNull().references(() => participants.id),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull().default("Sudadera"),
  model: text("model").notNull().default("Gildan 18500"),
  color: text("color").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  printName: text("print_name").notNull(),
  size: text("size").notNull(),
  namePlacement: text("name_placement").notNull().default("front"),
  frontExtra: text("front_extra").notNull().default("none"),
  frontDetail: text("front_detail").notNull().default(""),
  sleeveExtra: text("sleeve_extra").notNull().default("none"),
  sleeveDetail: text("sleeve_detail").notNull().default(""),
  extrasCents: integer("extras_cents").notNull().default(0),
  unitPriceCents: integer("unit_price_cents").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groupOrders.id),
  participantId: integer("participant_id").references(() => participants.id),
  reference: text("reference").notNull().unique(),
  method: text("method").notNull(),
  provider: text("provider").notNull().default("manual"),
  merchantOrder: text("merchant_order").unique(),
  idempotencyKey: text("idempotency_key").unique(),
  activeScopeKey: text("active_scope_key").unique(),
  providerTransactionId: text("provider_transaction_id").notNull().default(""),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  responseCode: text("response_code").notNull().default(""),
  callbackHash: text("callback_hash").notNull().default(""),
  validatedAt: text("validated_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const paymentEvents = sqliteTable("payment_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paymentId: integer("payment_id").notNull().references(() => payments.id),
  provider: text("provider").notNull(),
  eventKey: text("event_key").notNull().unique(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  processedAt: text("processed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paymentId: integer("payment_id").notNull().references(() => payments.id).unique(),
  status: text("status").notNull().default("not_requested"),
  invoiceNumber: text("invoice_number").notNull().default(""),
  requestedAt: text("requested_at").notNull().default(""),
  issuedAt: text("issued_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
