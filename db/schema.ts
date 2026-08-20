import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  configurationJson: text("configuration_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groupOrders.id),
  editToken: text("edit_token").notNull().unique(),
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
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  validatedAt: text("validated_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
