import { Router, type IRouter } from "express";
import { db, supportTicketsTable, officesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireAdmin, requireOfficeId } from "../lib/authHelpers";
import { sendSupportTicket } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// The two flavours an office can send, and the dashboard sections a message can
// relate to. Kept as Arabic strings (stored + displayed as-is) and validated
// server-side so the admin aggregation stays clean.
export const SUPPORT_TYPES = ["استفسار", "اقتراح"];
export const SUPPORT_SECTIONS = ["لوحة التحكم", "إعلاناتي", "الإحصائيات", "حساب المكتب", "عام / أخرى"];
const SUPPORT_STATUSES = ["جديد", "تمت المراجعة", "مغلق"];

// POST /api/support — office: submit a structured support / feedback ticket.
// Sender identity (name + numbers) is taken from the logged-in office, never
// trusted from the client, and snapshotted onto the ticket.
router.post("/support", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const { type, section, message } = req.body as { type?: string; section?: string; message?: string };
  if (!type || !SUPPORT_TYPES.includes(type)) {
    res.status(400).json({ field: "type", error: "يرجى اختيار نوع صالح (استفسار أو اقتراح)" }); return;
  }
  if (!section || !SUPPORT_SECTIONS.includes(section)) {
    res.status(400).json({ field: "section", error: "يرجى اختيار القسم المتعلّق" }); return;
  }
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  if (cleanMessage.length < 5) {
    res.status(400).json({ field: "message", error: "اكتب رسالتك (5 أحرف على الأقل)" }); return;
  }
  if (cleanMessage.length > 2000) {
    res.status(400).json({ field: "message", error: "الرسالة طويلة جداً (2000 حرف كحد أقصى)" }); return;
  }

  try {
    const [office] = await db
      .select({
        nameAr: officesTable.nameAr,
        phone: officesTable.phone,
        whatsapp: officesTable.whatsapp,
        email: officesTable.email,
      })
      .from(officesTable)
      .where(eq(officesTable.id, officeId))
      .limit(1);
    if (!office) { res.status(404).json({ error: "المكتب غير موجود" }); return; }

    await db.insert(supportTicketsTable).values({
      officeId,
      officeName: office.nameAr,
      officePhone: office.phone ?? null,
      officeWhatsapp: office.whatsapp ?? null,
      officeEmail: office.email ?? null,
      type,
      section,
      message: cleanMessage,
    });

    // Deliver to the team inbox too (best-effort — the ticket is already saved).
    sendSupportTicket({
      officeName: office.nameAr,
      officePhone: office.phone,
      officeWhatsapp: office.whatsapp,
      officeEmail: office.email,
      type,
      section,
      message: cleanMessage,
    }).catch((err) => logger.error({ err }, "Failed to email support ticket"));

    res.json({ success: true, message: "تم استلام رسالتك، شكراً لك. فريق فايند سيتواصل معك قريباً." });
  } catch (err) {
    logger.error({ err }, "Failed to save support ticket");
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/support — admin: all tickets, newest first (frontend aggregates).
router.get("/admin/support", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(supportTicketsTable)
      .orderBy(desc(supportTicketsTable.createdAt));
    res.json({ tickets: rows });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// PATCH /api/admin/support/:id — admin: change a ticket's status.
router.patch("/admin/support/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ""), 10);
  const { status } = req.body as { status?: string };
  if (!id || !status || !SUPPORT_STATUSES.includes(status)) {
    res.status(400).json({ error: "بيانات غير صالحة" }); return;
  }
  try {
    await db.update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
