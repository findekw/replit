import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  code: text("code").notNull().unique(),
  enableBadal: boolean("enable_badal").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const governoratesTable = pgTable("governorates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  countryCode: text("country_code").notNull().default("KW"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  governorateId: integer("governorate_id").notNull().references(() => governoratesTable.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGovernorateSchema = createInsertSchema(governoratesTable).omit({ id: true, createdAt: true });
export const insertAreaSchema = createInsertSchema(areasTable).omit({ id: true, createdAt: true });

export type Governorate = typeof governoratesTable.$inferSelect;
export type Area = typeof areasTable.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
