import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Key/value platform settings the admin edits at runtime (no deploy needed).
 * Keys so far:
 *   trial_days — free-trial length in days (default "14")
 */
export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Admin-editable legal pages (terms/privacy/disclaimer). The client must be
 * able to align them with state law himself — they were hardcoded arrays in
 * the frontend before.
 */
export const legalPagesTable = pgTable("legal_pages", {
  slug: text("slug").primaryKey(), // terms | privacy | disclaimer
  titleAr: text("title_ar").notNull(),
  intro: text("intro").notNull().default(""),
  // [{ title: string, content: string }]
  sections: text("sections").notNull().default("[]"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
