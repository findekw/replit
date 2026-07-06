import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { propertiesTable } from "./properties";
import { officesTable } from "./offices";

// Reports filed by visitors against a property listing.
export const propertyReportsTable = pgTable("property_reports", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => propertiesTable.id),
  officeId: integer("office_id").references(() => officesTable.id),
  reason: text("reason").notNull(),                   // تصنيف البلاغ
  note: text("note"),                                  // تفاصيل إضافية اختيارية
  status: text("status").notNull().default("جديد"),   // جديد | تمت المراجعة | مغلق
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPropertyReportSchema = createInsertSchema(propertyReportsTable).omit({ id: true, createdAt: true });
export type PropertyReport = typeof propertyReportsTable.$inferSelect;
export type InsertPropertyReport = z.infer<typeof insertPropertyReportSchema>;
