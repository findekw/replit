import { Router, type IRouter } from "express";
import { db, leadsTable, propertiesTable } from "@workspace/db";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import {
  ListLeadsResponse,
  UpdateLeadParams,
  UpdateLeadResponse,
} from "@workspace/api-zod";
import { getOfficeId, requireOfficeId } from "../lib/authHelpers";

/**
 * The office CRM.
 *
 * Two ways a customer enters it:
 *  - the office adds them by hand (from a listing row or the CRM page), or
 *  - a visitor submits the "أنا مهتم" form on a property page (public POST).
 *
 * Everything that READS or EDITS leads requires the owning office's session —
 * the old routes accepted a bare ?officeId and would hand any office's
 * customer names + phone numbers to whoever asked.
 */

const router: IRouter = Router();

function buildLeadObject(l: typeof leadsTable.$inferSelect, propertyTitle?: string | null, propertyRef?: string | null) {
  return {
    id: l.id,
    customerName: l.customerName,
    phone: l.phone,
    email: l.email ?? null,
    message: l.message ?? null,
    inquiryType: l.inquiryType,
    status: l.status,
    notes: l.notes ?? null,
    propertyId: l.propertyId ?? null,
    propertyTitle: propertyTitle ?? null,
    propertyRef: propertyRef ?? null,
    officeId: l.officeId ?? null,
    sourcePage: l.sourcePage ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

// ── Simple per-IP limiter for the public capture form ───────────────────────
// Same in-memory approach as the login limiter: fine for a single instance.
const captureHits = new Map<string, { count: number; resetAt: number }>();
const CAPTURE_WINDOW_MS = 60 * 60 * 1000;
const CAPTURE_MAX = 10;
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of captureHits) if (now > e.resetAt) captureHits.delete(ip);
}, CAPTURE_WINDOW_MS).unref?.();

function captureAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = captureHits.get(ip);
  if (!entry || now > entry.resetAt) {
    captureHits.set(ip, { count: 1, resetAt: now + CAPTURE_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= CAPTURE_MAX;
}

// GET /leads — the office's own CRM list. Click-tracking rows (placeholder
// "زائر" visitors from wa/call taps) are excluded: they're counters, not
// customers, and they'd drown the real ones.
router.get("/leads", async (req, res): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const status = String((req.query as Record<string, unknown>).status ?? "").trim();
  const propertyIdRaw = Number((req.query as Record<string, unknown>).propertyId ?? NaN);

  const conditions = [eq(leadsTable.officeId, officeId), ne(leadsTable.customerName, "زائر")];
  if (status) conditions.push(eq(leadsTable.status, status));
  if (Number.isFinite(propertyIdRaw) && propertyIdRaw > 0) conditions.push(eq(leadsTable.propertyId, propertyIdRaw));

  try {
    const leadsRaw = await db
      .select({
        lead: leadsTable,
        propertyTitle: propertiesTable.titleAr,
        propertyRef: propertiesTable.referenceId,
      })
      .from(leadsTable)
      .leftJoin(propertiesTable, eq(leadsTable.propertyId, propertiesTable.id))
      .where(and(...conditions))
      .orderBy(desc(leadsTable.createdAt))
      .limit(500);

    res.json(ListLeadsResponse.parse(
      leadsRaw.map(({ lead, propertyTitle, propertyRef }: { lead: typeof leadsTable.$inferSelect; propertyTitle: string | null; propertyRef: string | null }) =>
        buildLeadObject(lead, propertyTitle ?? null, propertyRef ?? null)
      )
    ));
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /leads/track — anonymous wa/call click counters (unchanged behaviour).
router.post("/leads/track", async (req, res): Promise<void> => {
  const { officeId, propertyId, interactionType, source } = req.body as {
    officeId?: unknown;
    propertyId?: unknown;
    interactionType?: unknown;
    source?: unknown;
  };

  if (!officeId || !interactionType) {
    res.status(400).json({ error: "officeId and interactionType are required" });
    return;
  }

  const inquiryType = interactionType === "whatsapp" ? "واتساب" : "اتصال";
  const propId = propertyId ? Number(propertyId) : null;
  const offId = Number(officeId);

  const [lead] = await db
    .insert(leadsTable)
    .values({
      customerName: "زائر",
      phone: "—",
      inquiryType,
      propertyId: propId,
      officeId: offId,
      sourcePage: source ? String(source) : null,
      status: "جديد",
    })
    .returning();

  if (propId) {
    if (interactionType === "whatsapp") {
      await db
        .update(propertiesTable)
        .set({ whatsappClicks: sql`${propertiesTable.whatsappClicks} + 1` })
        .where(eq(propertiesTable.id, propId));
    } else if (interactionType === "call") {
      await db
        .update(propertiesTable)
        .set({ callClicks: sql`${propertiesTable.callClicks} + 1` })
        .where(eq(propertiesTable.id, propId));
    }
  }

  res.status(201).json({ ok: true, id: lead.id });
});

// POST /leads — dual mode:
//  - office session: manual CRM entry, any of its listings, any status/notes.
//  - no session: the public "أنا مهتم" form. Requires propertyId; the office
//    is derived from the listing server-side (a caller can't aim a lead at an
//    arbitrary office), status is forced to جديد, and it's rate limited.
router.post("/leads", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const customerName = String(body.customerName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = body.message ? String(body.message).trim().slice(0, 500) : null;

  if (customerName.length < 2) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
  if (!/^[0-9+\s-]{6,20}$/.test(phone)) { res.status(400).json({ error: "رقم الهاتف غير صالح" }); return; }

  const sessionOfficeId = await getOfficeId(req);

  try {
    if (sessionOfficeId !== null) {
      // Manual entry by the office itself.
      const propertyId = body.propertyId ? Number(body.propertyId) : null;
      if (propertyId) {
        const [prop] = await db.select({ officeId: propertiesTable.officeId }).from(propertiesTable).where(eq(propertiesTable.id, propertyId)).limit(1);
        if (!prop || prop.officeId !== sessionOfficeId) {
          res.status(403).json({ error: "الإعلان لا يتبع مكتبك" });
          return;
        }
      }
      const [lead] = await db.insert(leadsTable).values({
        customerName,
        phone,
        email: body.email ? String(body.email).trim() : null,
        message,
        inquiryType: body.inquiryType ? String(body.inquiryType) : "يدوي",
        status: body.status ? String(body.status) : "جديد",
        notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
        propertyId,
        officeId: sessionOfficeId,
        sourcePage: "manual",
      }).returning();
      res.status(201).json(buildLeadObject(lead));
      return;
    }

    // Public capture.
    const ip = String(req.ip ?? req.socket.remoteAddress ?? "?");
    if (!captureAllowed(ip)) {
      res.status(429).json({ error: "محاولات كثيرة، حاول لاحقاً" });
      return;
    }
    const propertyId = Number(body.propertyId ?? NaN);
    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      res.status(400).json({ error: "الإعلان مطلوب" });
      return;
    }
    const [prop] = await db.select({ officeId: propertiesTable.officeId }).from(propertiesTable).where(eq(propertiesTable.id, propertyId)).limit(1);
    if (!prop?.officeId) { res.status(404).json({ error: "الإعلان غير موجود" }); return; }

    const [lead] = await db.insert(leadsTable).values({
      customerName,
      phone,
      message,
      inquiryType: "طلب تواصل",
      status: "جديد",
      propertyId,
      officeId: prop.officeId,
      sourcePage: "property_form",
    }).returning();
    res.status(201).json({ ok: true, id: lead.id });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// PATCH /leads/:id — owner only. The CRM edits status, notes, name and phone.
router.patch("/leads/:id", async (req, res): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = req.body as Record<string, unknown>;
  const updateData: Record<string, unknown> = {};
  if (body.status != null) updateData.status = String(body.status);
  if (body.notes != null) updateData.notes = String(body.notes).slice(0, 1000);
  if (body.customerName != null) {
    const v = String(body.customerName).trim();
    if (v.length < 2) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
    updateData.customerName = v;
  }
  if (body.phone != null) {
    const v = String(body.phone).trim();
    if (!/^[0-9+\s-]{6,20}$/.test(v)) { res.status(400).json({ error: "رقم الهاتف غير صالح" }); return; }
    updateData.phone = v;
  }
  if (!Object.keys(updateData).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }

  try {
    const [lead] = await db
      .update(leadsTable)
      .set(updateData)
      .where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.officeId, officeId)))
      .returning();

    if (!lead) { res.status(404).json({ error: "العميل غير موجود" }); return; }
    res.json(UpdateLeadResponse.parse(buildLeadObject(lead)));
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// DELETE /leads/:id — owner only.
router.delete("/leads/:id", async (req, res): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  try {
    const [lead] = await db
      .delete(leadsTable)
      .where(and(eq(leadsTable.id, id), eq(leadsTable.officeId, officeId)))
      .returning();
    if (!lead) { res.status(404).json({ error: "العميل غير موجود" }); return; }
    res.json({ message: "تم حذف العميل" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
