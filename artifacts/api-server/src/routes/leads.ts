import { Router, type IRouter } from "express";
import { db, leadsTable, propertiesTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  ListLeadsQueryParams,
  ListLeadsResponse,
  CreateLeadBody,
  UpdateLeadParams,
  UpdateLeadBody,
  UpdateLeadResponse,
} from "@workspace/api-zod";

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

router.get("/leads", async (req, res): Promise<void> => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { officeId, status, propertyId } = parsed.data;

  const conditions = [];
  if (officeId != null) conditions.push(eq(leadsTable.officeId, Number(officeId)));
  if (status != null) conditions.push(eq(leadsTable.status, status));
  if (propertyId != null) conditions.push(eq(leadsTable.propertyId, Number(propertyId)));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const leadsRaw = await db
    .select({
      lead: leadsTable,
      propertyTitle: propertiesTable.titleAr,
      propertyRef: propertiesTable.referenceId,
    })
    .from(leadsTable)
    .leftJoin(propertiesTable, eq(leadsTable.propertyId, propertiesTable.id))
    .where(whereClause)
    .orderBy(desc(leadsTable.createdAt))
    .limit(100);

  res.json(ListLeadsResponse.parse(
    leadsRaw.map(({ lead, propertyTitle, propertyRef }) =>
      buildLeadObject(lead, propertyTitle ?? null, propertyRef ?? null)
    )
  ));
});

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

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      message: parsed.data.message ?? null,
      inquiryType: parsed.data.inquiryType,
      propertyId: parsed.data.propertyId ?? null,
      officeId: parsed.data.officeId ?? null,
      sourcePage: parsed.data.sourcePage ?? null,
      status: "جديد",
    })
    .returning();

  res.status(201).json(buildLeadObject(lead));
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.notes != null) updateData.notes = parsed.data.notes;

  const [lead] = await db
    .update(leadsTable)
    .set(updateData)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(buildLeadObject(lead)));
});

export default router;
