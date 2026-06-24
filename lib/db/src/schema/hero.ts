import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Admin-managed homepage hero banners / promo slides. Each slide is a
// background image with an optional headline, subtitle, and a CTA button
// (text + link). Shown as an auto-rotating carousel on the homepage hero.
export const heroSlidesTable = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type HeroSlide = typeof heroSlidesTable.$inferSelect;
