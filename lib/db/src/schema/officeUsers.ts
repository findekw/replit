import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { officesTable } from "./offices";

// Office login accounts — separate identity table from regular users and
// admins, with its own credentials and its own session cookie (finde_office).
// Each office account owns exactly one office (the public business entity).
// status: pending (awaiting admin approval) | active | banned.
export const officeUsersTable = pgTable("office_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("pending"),
  officeId: integer("office_id").references(() => officesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOfficeUserSchema = createInsertSchema(officeUsersTable).omit({
  id: true,
  passwordHash: true,
  officeId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type OfficeUser = typeof officeUsersTable.$inferSelect;
export type InsertOfficeUser = z.infer<typeof insertOfficeUserSchema>;
