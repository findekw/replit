import { Router, type IRouter } from "express";
import { db, heroSlidesTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireAdmin } from "../lib/authHelpers";

const router: IRouter = Router();

function clean(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

// ── Public: active hero slides for the homepage ──────────────────────────────
router.get("/hero-slides", async (_req: Request, res: Response): Promise<void> => {
  try {
    const slides = await db
      .select()
      .from(heroSlidesTable)
      .where(eq(heroSlidesTable.active, true))
      .orderBy(asc(heroSlidesTable.sortOrder), desc(heroSlidesTable.createdAt));
    res.json({ slides });
  } catch {
    res.json({ slides: [] });
  }
});

// ── Admin: list all ──────────────────────────────────────────────────────────
router.get("/admin/hero-slides", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const slides = await db.select().from(heroSlidesTable).orderBy(asc(heroSlidesTable.sortOrder), desc(heroSlidesTable.createdAt));
    res.json({ slides });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Admin: create ────────────────────────────────────────────────────────────
router.post("/admin/hero-slides", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const imageUrl = clean(body.imageUrl);
  if (!imageUrl) { res.status(400).json({ error: "صورة البانر مطلوبة" }); return; }
  try {
    const [created] = await db.insert(heroSlidesTable).values({
      imageUrl,
      title: clean(body.title),
      subtitle: clean(body.subtitle),
      ctaText: clean(body.ctaText),
      ctaUrl: clean(body.ctaUrl),
      active: body.active === false ? false : true,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    }).returning();
    res.status(201).json({ slide: created, message: "تم إضافة البانر" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Admin: update ────────────────────────────────────────────────────────────
router.put("/admin/hero-slides/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (body.imageUrl !== undefined) { const v = clean(body.imageUrl); if (!v) { res.status(400).json({ error: "صورة البانر مطلوبة" }); return; } updates.imageUrl = v; }
  if (body.title !== undefined) updates.title = clean(body.title);
  if (body.subtitle !== undefined) updates.subtitle = clean(body.subtitle);
  if (body.ctaText !== undefined) updates.ctaText = clean(body.ctaText);
  if (body.ctaUrl !== undefined) updates.ctaUrl = clean(body.ctaUrl);
  if (body.active !== undefined) updates.active = !!body.active;
  if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;
  try {
    const [updated] = await db.update(heroSlidesTable).set(updates).where(eq(heroSlidesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "البانر غير موجود" }); return; }
    res.json({ slide: updated, message: "تم تحديث البانر" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Admin: delete ────────────────────────────────────────────────────────────
router.delete("/admin/hero-slides/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    await db.delete(heroSlidesTable).where(eq(heroSlidesTable.id, id));
    res.json({ message: "تم حذف البانر" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
