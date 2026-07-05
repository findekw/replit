import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { governoratesTable, areasTable } from "./locations";
import { officesTable } from "./offices";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  referenceId: text("reference_id").notNull().unique(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  status: text("status").notNull(), // للإيجار | للبيع | للبدل | طلب
  type: text("type").notNull(), // بيت | شقة | قسيمة | ارض | دور | محل | مكتب | مخزن | مستودع | شاليه | استراحة | مزرعة | عمارة | مجمع
  price: integer("price").notNull().default(0),
  currency: text("currency").notNull().default("KWD"),
  areaSize: integer("area_size"), // m²
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  furnished: text("furnished"), // مفروش | غير مفروش | شبه مفروش
  amenities: text("amenities").array().notNull().default([]),
  videoUrl: text("video_url"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"),
  views: integer("views").notNull().default(0),
  whatsappClicks: integer("whatsapp_clicks").notNull().default(0),
  callClicks: integer("call_clicks").notNull().default(0),
  governorateId: integer("governorate_id").references(() => governoratesTable.id),
  areaId: integer("area_id").references(() => areasTable.id),
  officeId: integer("office_id").references(() => officesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const propertyImagesTable = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPropertyImageSchema = createInsertSchema(propertyImagesTable).omit({ id: true, createdAt: true });

export type Property = typeof propertiesTable.$inferSelect;
export type PropertyImage = typeof propertyImagesTable.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
