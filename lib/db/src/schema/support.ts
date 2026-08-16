import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { officesTable } from "./offices";

// Structured support / feedback tickets an office submits from its dashboard.
// Two flavours (استفسار / اقتراح) tagged with the dashboard section they relate
// to, so the team can spot recurring problems per area ("many offices flag
// إعلاناتي → there's a problem there"). The sender identity (name + numbers) is
// snapshotted at submit time so a ticket stays self-contained even if the office
// later edits its profile.
export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => officesTable.id),
  officeName: text("office_name").notNull(),          // snapshot of the sender
  officePhone: text("office_phone"),
  officeWhatsapp: text("office_whatsapp"),
  officeEmail: text("office_email"),
  type: text("type").notNull(),                        // استفسار | اقتراح
  section: text("section").notNull(),                  // القسم المتعلّق
  message: text("message").notNull(),
  status: text("status").notNull().default("جديد"),    // جديد | تمت المراجعة | مغلق
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({ id: true, createdAt: true });
export type SupportTicket = typeof supportTicketsTable.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
