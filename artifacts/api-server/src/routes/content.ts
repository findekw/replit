import { Router, type IRouter } from "express";
import { db, legalPagesTable, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireAdmin } from "../lib/authHelpers";
import { getTrialDays } from "../lib/settings";

/**
 * Admin-editable content: the legal pages (client: "السياسات لازم نعدلها حسب
 * قوانين الدولة — أبي صلاحية أعدلها") and runtime platform settings such as
 * the free-trial length.
 */

const router: IRouter = Router();

const LEGAL_SLUGS = new Set(["terms", "privacy", "disclaimer"]);

type LegalSection = { title: string; content: string };

function parseSections(raw: string): LegalSection[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((s) => ({ title: String(s?.title ?? "").trim(), content: String(s?.content ?? "").trim() }))
      .filter((s) => s.title || s.content);
  } catch {
    return [];
  }
}

// ── Public ──────────────────────────────────────────────────────────────────

router.get("/legal/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params["slug"] ?? "");
  if (!LEGAL_SLUGS.has(slug)) { res.status(404).json({ error: "الصفحة غير موجودة" }); return; }
  try {
    const [page] = await db.select().from(legalPagesTable).where(eq(legalPagesTable.slug, slug)).limit(1);
    if (!page) { res.status(404).json({ error: "الصفحة غير موجودة" }); return; }
    res.json({ slug: page.slug, titleAr: page.titleAr, intro: page.intro, sections: parseSections(page.sections), updatedAt: page.updatedAt.toISOString() });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// The trial length shown on marketing pages — same value the backend grants.
router.get("/platform/trial-days", async (_req, res): Promise<void> => {
  res.json({ days: await getTrialDays() });
});

// ── Admin ───────────────────────────────────────────────────────────────────

router.put("/admin/legal/:slug", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params["slug"] ?? "");
  if (!LEGAL_SLUGS.has(slug)) { res.status(404).json({ error: "الصفحة غير موجودة" }); return; }

  const body = req.body as Record<string, unknown>;
  const titleAr = String(body.titleAr ?? "").trim();
  const intro = String(body.intro ?? "").trim();
  const sections = Array.isArray(body.sections)
    ? (body.sections as unknown[])
        .map((s) => ({ title: String((s as Record<string, unknown>)?.title ?? "").trim().slice(0, 200), content: String((s as Record<string, unknown>)?.content ?? "").trim().slice(0, 5000) }))
        .filter((s) => s.title && s.content)
        .slice(0, 30)
    : [];

  if (!titleAr) { res.status(400).json({ error: "عنوان الصفحة مطلوب" }); return; }
  if (!sections.length) { res.status(400).json({ error: "أضف بنداً واحداً على الأقل (عنوان + نص)" }); return; }

  try {
    const values = { slug, titleAr, intro, sections: JSON.stringify(sections) };
    const [existing] = await db.select({ slug: legalPagesTable.slug }).from(legalPagesTable).where(eq(legalPagesTable.slug, slug)).limit(1);
    if (existing) await db.update(legalPagesTable).set(values).where(eq(legalPagesTable.slug, slug));
    else await db.insert(legalPagesTable).values(values);
    res.json({ message: "تم حفظ الصفحة — التعديل ظاهر للزوار فوراً" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/settings/trial-days", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const days = Number((req.body as Record<string, unknown>)?.days);
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    res.status(400).json({ error: "اكتب عدد أيام بين 1 و 365" });
    return;
  }
  try {
    const value = String(Math.round(days));
    const [existing] = await db.select({ key: platformSettingsTable.key }).from(platformSettingsTable).where(eq(platformSettingsTable.key, "trial_days")).limit(1);
    if (existing) await db.update(platformSettingsTable).set({ value }).where(eq(platformSettingsTable.key, "trial_days"));
    else await db.insert(platformSettingsTable).values({ key: "trial_days", value });
    res.json({ message: `تم — التجربة المجانية الآن ${value} يوم لكل تسجيل جديد` });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
