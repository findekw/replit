import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Named permission bundles the owner defines ("موظف إعلانات", "محاسب"...).
// permissions holds keys matching the admin panel tabs: offices, listings,
// reports, subscriptions, locations, catalog, tools.
export const adminRolesTable = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminRole = typeof adminRolesTable.$inferSelect;

// Platform administrators — fully separate identity table with its own
// credentials and its own session cookie (finde_admin). A human may also have
// an office and/or user account under the same email; those are independent.
// roleId null = owner: full access, and the only one who can manage admins
// and roles themselves.
export const adminsTable = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"),
  roleId: integer("role_id").references(() => adminRolesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdminSchema = createInsertSchema(adminsTable).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type Admin = typeof adminsTable.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
