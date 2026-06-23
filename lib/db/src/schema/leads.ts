import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { propertiesTable } from "./properties";
import { officesTable } from "./offices";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message"),
  inquiryType: text("inquiry_type").notNull().default("استفسار"), // استفسار | طلب معاينة | طلب سعر
  status: text("status").notNull().default("جديد"), // جديد | مهتم | تم التواصل | غير جاد | مغلق
  notes: text("notes"),
  propertyId: integer("property_id").references(() => propertiesTable.id),
  officeId: integer("office_id").references(() => officesTable.id),
  sourcePage: text("source_page"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
