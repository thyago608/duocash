import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_username_idx").on(table.username),
]);

export const months = pgTable("months", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  label: text("label").notNull(),
  orderIndex: integer("order_index").notNull(),
}, (table) => [
  uniqueIndex("months_slug_idx").on(table.slug),
]);

export const incomeLines = pgTable("income_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  monthId: uuid("month_id").notNull().references(() => months.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  chipLabel: text("chip_label"),
  amountCents: integer("amount_cents"),
  person: text("person", { enum: ["thyago", "thayla", "ambos"] }).notNull(),
  isReceived: boolean("is_received").notNull().default(false),
  receivedBy: uuid("received_by").references(() => users.id),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  orderIndex: integer("order_index").notNull(),
});

export const expenseLines = pgTable("expense_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  monthId: uuid("month_id").notNull().references(() => months.id, { onDelete: "cascade" }),
  section: text("section", { enum: ["fixed", "punctual"] }).notNull(),
  label: text("label").notNull(),
  chipLabel: text("chip_label"),
  amountCents: integer("amount_cents").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  paidBy: uuid("paid_by").references(() => users.id),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  orderIndex: integer("order_index").notNull(),
});

export const allocationBuckets = pgTable("allocation_buckets", {
  id: uuid("id").primaryKey().defaultRandom(),
  monthId: uuid("month_id").notNull().references(() => months.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["tracked", "deposit"] }).notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color", { enum: ["green", "yellow", "red", "blue", "purple", "orange"] }).notNull(),
  budgetCents: integer("budget_cents").notNull(),
  isDeposited: boolean("is_deposited").notNull().default(false),
  depositedBy: uuid("deposited_by").references(() => users.id),
  depositedAt: timestamp("deposited_at", { withTimezone: true }),
  orderIndex: integer("order_index").notNull(),
});

export const allocationEntries = pgTable("allocation_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketId: uuid("bucket_id").notNull().references(() => allocationBuckets.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reserveWithdrawals = pgTable("reserve_withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const monthsRelations = relations(months, ({ many }) => ({
  incomeLines: many(incomeLines),
  expenseLines: many(expenseLines),
  allocationBuckets: many(allocationBuckets),
}));

export const incomeLinesRelations = relations(incomeLines, ({ one }) => ({
  month: one(months, { fields: [incomeLines.monthId], references: [months.id] }),
}));

export const expenseLinesRelations = relations(expenseLines, ({ one }) => ({
  month: one(months, { fields: [expenseLines.monthId], references: [months.id] }),
}));

export const allocationBucketsRelations = relations(allocationBuckets, ({ one, many }) => ({
  month: one(months, { fields: [allocationBuckets.monthId], references: [months.id] }),
  entries: many(allocationEntries),
}));

export const allocationEntriesRelations = relations(allocationEntries, ({ one }) => ({
  bucket: one(allocationBuckets, {
    fields: [allocationEntries.bucketId],
    references: [allocationBuckets.id],
  }),
}));
