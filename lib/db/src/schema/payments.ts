import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

// One row per UPayments subscription payment attempt by an office. We create the
// row (status "pending") before redirecting to UPayments, then reconcile it from
// the async webhook / return page by re-verifying with UPayments' get-payment-status
// API. The unique orderRef makes activation idempotent (a webhook can fire twice).
export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").notNull(),
  planId: integer("plan_id"),
  orderRef: text("order_ref").notNull().unique(),
  sessionId: text("session_id"),
  amountFils: integer("amount_fils").notNull(), // price in fils (KWD * 1000)
  currency: text("currency").notNull().default("KWD"),
  status: text("status").notNull().default("pending"), // pending | paid | failed
  paymentLink: text("payment_link"),
  rawStatus: text("raw_status"), // last UPayments transaction result, for auditing
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export type Payment = typeof paymentsTable.$inferSelect;
