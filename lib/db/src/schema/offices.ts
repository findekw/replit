import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { governoratesTable } from "./locations";

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  price: integer("price").notNull().default(0), // stored in fils (KWD * 1000)
  currency: text("currency").notNull().default("KWD"),
  durationDays: integer("duration_days").notNull().default(30), // subscription length granted on payment
  maxListings: integer("max_listings").notNull().default(10),
  featuredListings: integer("featured_listings").notNull().default(0),
  hasLeadDashboard: boolean("has_lead_dashboard").notNull().default(false),
  hasAnalytics: boolean("has_analytics").notNull().default(false),
  hasWhatsappSupport: boolean("has_whatsapp_support").notNull().default(false),
  hasPriorityPlacement: boolean("has_priority_placement").notNull().default(false),
  hasCustomProfile: boolean("has_custom_profile").notNull().default(false),
  features: text("features").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officesTable = pgTable("offices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  logo: text("logo"),
  coverImage: text("cover_image"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  website: text("website"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  governorateId: integer("governorate_id").references(() => governoratesTable.id),
  planId: integer("plan_id").references(() => subscriptionPlansTable.id),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  totalViews: integer("total_views").notNull().default(0),
  totalLeads: integer("total_leads").notNull().default(0),
  subscriptionPlan: text("subscription_plan").notNull().default("basic"),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  subscriptionEndsAt: timestamp("subscription_ends_at", { withTimezone: true }),
  slugEdits: integer("slug_edits").notNull().default(0),
  landingTemplate: text("landing_template").notNull().default("classic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOfficeSchema = createInsertSchema(officesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlanSchema = createInsertSchema(subscriptionPlansTable).omit({ id: true, createdAt: true });

export type Office = typeof officesTable.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;
