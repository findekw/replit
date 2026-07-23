import { Router, type IRouter } from "express";
import { db, catalogOptionsTable } from "@workspace/db";
import { and, eq, asc } from "drizzle-orm";

/**
 * Public read of the admin-editable option lists (furnishing states, amenities)
 * that the add-listing form used to hardcode. Only active options, ordered.
 */
const router: IRouter = Router();

const KINDS = new Set(["furnished", "amenity", "lead_status"]);

router.get("/catalog", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({ kind: catalogOptionsTable.kind, nameAr: catalogOptionsTable.nameAr })
      .from(catalogOptionsTable)
      .where(eq(catalogOptionsTable.active, true))
      .orderBy(asc(catalogOptionsTable.sortOrder), asc(catalogOptionsTable.id));

    const requested = String(req.query["kind"] ?? "");
    if (requested && KINDS.has(requested)) {
      res.json({ options: rows.filter((r: { kind: string }) => r.kind === requested).map((r: { nameAr: string }) => r.nameAr) });
      return;
    }

    // Grouped by kind (one request, all lists).
    const grouped: Record<string, string[]> = { furnished: [], amenity: [], lead_status: [] };
    for (const r of rows as { kind: string; nameAr: string }[]) {
      (grouped[r.kind] ??= []).push(r.nameAr);
    }
    res.json(grouped);
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
