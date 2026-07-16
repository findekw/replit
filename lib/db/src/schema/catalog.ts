import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Admin-editable option lists that used to be hardcoded in the frontend
 * (furnishing states, property amenities). One generic table keyed by `kind`
 * rather than a table per list, so a new kind is a seed row, not a migration.
 *
 * Values are stored as the Arabic label because that's exactly what a listing
 * saves (properties.furnished is the text, amenities is a text[]). Renaming an
 * option here therefore does NOT rewrite listings that already stored the old
 * label — same trade-off as areas: deactivate to hide from the picker without
 * disturbing published listings.
 */
export const catalogOptionsTable = pgTable("catalog_options", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // "furnished" | "amenity"
  nameAr: text("name_ar").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CatalogOption = typeof catalogOptionsTable.$inferSelect;
