import { Router, type IRouter } from "express";
import { db, propertyReportsTable, propertiesTable, officesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireAdmin } from "../lib/authHelpers";

const router: IRouter = Router();

export const VALID_REPORT_REASONS = [
  "معلومات غير صحيحة",
  "إعلان مكرر",
  "العقار غير متاح / مباع",
  "سعر غير صحيح",
  "صور مضللة",
  "احتيال أو نصب",
  "أخرى",
];

const VALID_REPORT_STATUSES = ["جديد", "تمت المراجعة", "مغلق"];

// POST /api/properties/:id/report — public: a visitor files a report on a listing
router.post("/properties/:id/report", async (req: Request, res: Response): Promise<void> => {
  const propertyId = parseInt(String(req.params.id ?? ""), 10);
  if (!propertyId) { res.status(400).json({ error: "معرّف العقار غير صالح" }); return; }

  const { reason, note } = req.body as { reason?: string; note?: string };
  if (!reason || !VALID_REPORT_REASONS.includes(reason)) {
    res.status(400).json({ field: "reason", error: "يرجى اختيار سبب صالح للإبلاغ" }); return;
  }
  const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

  try {
    const [property] = await db
      .select({ id: propertiesTable.id, officeId: propertiesTable.officeId })
      .from(propertiesTable)
      .where(eq(propertiesTable.id, propertyId))
      .limit(1);
    if (!property) { res.status(404).json({ error: "العقار غير موجود" }); return; }

    await db.insert(propertyReportsTable).values({
      propertyId,
      officeId: property.officeId ?? null,
      reason,
      note: cleanNote || null,
    });
    res.json({ success: true, message: "تم استلام بلاغك، شكرًا لك. سيقوم فريق المنصة بمراجعته." });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/reports — admin: list all reports with property + office context
router.get("/admin/reports", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: propertyReportsTable.id,
        propertyId: propertyReportsTable.propertyId,
        officeId: propertyReportsTable.officeId,
        reason: propertyReportsTable.reason,
        note: propertyReportsTable.note,
        status: propertyReportsTable.status,
        createdAt: propertyReportsTable.createdAt,
        propertyTitle: propertiesTable.titleAr,
        officeName: officesTable.nameAr,
      })
      .from(propertyReportsTable)
      .leftJoin(propertiesTable, eq(propertyReportsTable.propertyId, propertiesTable.id))
      .leftJoin(officesTable, eq(propertyReportsTable.officeId, officesTable.id))
      .orderBy(desc(propertyReportsTable.createdAt));
    res.json({ reports: rows });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// PATCH /api/admin/reports/:id — admin: change a report's status
router.patch("/admin/reports/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""), 10);
  const { status } = req.body as { status?: string };
  if (!id || !status || !VALID_REPORT_STATUSES.includes(status)) {
    res.status(400).json({ error: "بيانات غير صالحة" }); return;
  }
  try {
    await db.update(propertyReportsTable).set({ status }).where(eq(propertyReportsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
