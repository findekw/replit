import { Router, type IRouter, type Request, type Response } from "express";
import { db, officesTable, propertiesTable, propertyImagesTable, governoratesTable, areasTable, subscriptionPlansTable, leadsTable } from "@workspace/db";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { getOfficeId } from "../lib/authHelpers";
import {
  ListOfficesQueryParams,
  ListOfficesResponse,
  GetFeaturedOfficesResponse,
  GetOfficeParams,
  GetOfficeResponse,
  GetOfficePropertiesParams,
  GetOfficePropertiesQueryParams,
  GetOfficePropertiesResponse,
  GetOfficeStatsParams,
  GetOfficeStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `/api${url}`;
  return url;
}

function buildOfficeObject(o: typeof officesTable.$inferSelect, extras: {
  governorateName?: string | null;
  planName?: string | null;
  totalListings?: number;
  activeListings?: number;
}) {
  return {
    id: o.id,
    name: o.name,
    nameAr: o.nameAr,
    slug: o.slug,
    description: o.description ?? null,
    descriptionAr: o.descriptionAr ?? null,
    logo: o.logo ?? null,
    coverImage: o.coverImage ?? null,
    phone: o.phone ?? null,
    whatsapp: o.whatsapp ?? null,
    email: o.email ?? null,
    website: o.website ?? null,
    instagram: o.instagram ?? null,
    twitter: o.twitter ?? null,
    licenseNumber: (o as { licenseNumber?: string | null }).licenseNumber ?? null,
    commercialReg: (o as { commercialReg?: string | null }).commercialReg ?? null,
    governorateId: o.governorateId ?? null,
    governorateName: extras.governorateName ?? null,
    verified: o.verified,
    featured: o.featured,
    active: o.active,
    totalListings: extras.totalListings ?? 0,
    activeListings: extras.activeListings ?? 0,
    planName: extras.planName ?? null,
    slugEdits: o.slugEdits ?? 0,
    landingTemplate: (o as { landingTemplate?: string }).landingTemplate ?? "classic",
    createdAt: o.createdAt.toISOString(),
  };
}

const LANDING_TEMPLATES = ["modern", "luxury", "minimal", "classic"];

router.get("/offices", async (req, res): Promise<void> => {
  const parsed = ListOfficesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page: rawPage, limit: rawLimit, governorateId, verified } = parsed.data;
  const page = Number(rawPage ?? 1);
  const limit = Number(rawLimit ?? 12);
  const offset = (page - 1) * limit;

  const conditions = [eq(officesTable.active, true)];
  if (governorateId != null) {
    conditions.push(eq(officesTable.governorateId, Number(governorateId)));
  }
  if (verified != null) {
    conditions.push(eq(officesTable.verified, verified === "true"));
  }

  const whereClause = and(...conditions);

  const [officesRaw, totalRaw] = await Promise.all([
    db
      .select({
        office: officesTable,
        governorateName: governoratesTable.nameAr,
        planName: subscriptionPlansTable.nameAr,
      })
      .from(officesTable)
      .leftJoin(governoratesTable, eq(officesTable.governorateId, governoratesTable.id))
      .leftJoin(subscriptionPlansTable, eq(officesTable.planId, subscriptionPlansTable.id))
      .where(whereClause)
      .orderBy(desc(officesTable.featured), desc(officesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(officesTable).where(whereClause),
  ]);

  const officeIds = officesRaw.map((o) => o.office.id);
  const listingCounts = officeIds.length
    ? await db
        .select({
          officeId: propertiesTable.officeId,
          total: count(),
          active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
        })
        .from(propertiesTable)
        .where(inArray(propertiesTable.officeId, officeIds))
        .groupBy(propertiesTable.officeId)
    : [];

  const listingMap: Record<number, { total: number; active: number }> = {};
  for (const lc of listingCounts) {
    if (lc.officeId != null) {
      listingMap[lc.officeId] = { total: Number(lc.total), active: Number(lc.active) };
    }
  }

  const total = Number(totalRaw[0]?.count ?? 0);
  const offices = officesRaw.map(({ office, governorateName, planName }) =>
    buildOfficeObject(office, {
      governorateName: governorateName ?? null,
      planName: planName ?? null,
      totalListings: listingMap[office.id]?.total ?? 0,
      activeListings: listingMap[office.id]?.active ?? 0,
    })
  );

  res.json(ListOfficesResponse.parse({
    offices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }));
});

// GET /api/offices/by-slug/:slug
router.get("/offices/by-slug/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").toLowerCase().trim();
  if (!slug) {
    res.status(400).json({ error: "Slug is required" });
    return;
  }

  const [row] = await db
    .select({
      office: officesTable,
      governorateName: governoratesTable.nameAr,
      planName: subscriptionPlansTable.nameAr,
    })
    .from(officesTable)
    .leftJoin(governoratesTable, eq(officesTable.governorateId, governoratesTable.id))
    .leftJoin(subscriptionPlansTable, eq(officesTable.planId, subscriptionPlansTable.id))
    .where(eq(officesTable.slug, slug));

  if (!row) {
    res.status(404).json({ error: "Office not found" });
    return;
  }

  const officeId = row.office.id;

  const [listingCount] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
    })
    .from(propertiesTable)
    .where(eq(propertiesTable.officeId, officeId));

  res.json(buildOfficeObject(row.office, {
    governorateName: row.governorateName ?? null,
    planName: row.planName ?? null,
    totalListings: Number(listingCount?.total ?? 0),
    activeListings: Number(listingCount?.active ?? 0),
  }));
});

// GET /api/slugs/check?slug=xxx
router.get("/slugs/check", async (req, res): Promise<void> => {
  const slug = String(req.query.slug ?? "").toLowerCase().trim();
  if (!slug) {
    res.status(400).json({ error: "Slug is required" });
    return;
  }
  const RESERVED = ["properties", "offices", "admin", "login", "register", "plans", "dashboard", "api", "health", "by-slug"];
  if (RESERVED.includes(slug)) {
    res.json({ available: false });
    return;
  }
  const existing = await db.select({ id: officesTable.id }).from(officesTable).where(eq(officesTable.slug, slug)).limit(1);
  res.json({ available: existing.length === 0 });
});

router.get("/offices/featured", async (_req, res): Promise<void> => {
  const officesRaw = await db
    .select({
      office: officesTable,
      governorateName: governoratesTable.nameAr,
      planName: subscriptionPlansTable.nameAr,
    })
    .from(officesTable)
    .leftJoin(governoratesTable, eq(officesTable.governorateId, governoratesTable.id))
    .leftJoin(subscriptionPlansTable, eq(officesTable.planId, subscriptionPlansTable.id))
    .where(and(eq(officesTable.active, true), eq(officesTable.featured, true)))
    .orderBy(desc(officesTable.createdAt))
    .limit(6);

  const officeIds = officesRaw.map((o) => o.office.id);
  const listingCounts = officeIds.length
    ? await db
        .select({
          officeId: propertiesTable.officeId,
          total: count(),
          active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
        })
        .from(propertiesTable)
        .where(inArray(propertiesTable.officeId, officeIds))
        .groupBy(propertiesTable.officeId)
    : [];

  const listingMap: Record<number, { total: number; active: number }> = {};
  for (const lc of listingCounts) {
    if (lc.officeId != null) {
      listingMap[lc.officeId] = { total: Number(lc.total), active: Number(lc.active) };
    }
  }

  res.json(GetFeaturedOfficesResponse.parse(
    officesRaw.map(({ office, governorateName, planName }) =>
      buildOfficeObject(office, {
        governorateName: governorateName ?? null,
        planName: planName ?? null,
        totalListings: listingMap[office.id]?.total ?? 0,
        activeListings: listingMap[office.id]?.active ?? 0,
      })
    )
  ));
});

router.get("/offices/:id", async (req, res): Promise<void> => {
  const params = GetOfficeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const officeId = params.data.id;

  const [row] = await db
    .select({
      office: officesTable,
      governorateName: governoratesTable.nameAr,
      planName: subscriptionPlansTable.nameAr,
    })
    .from(officesTable)
    .leftJoin(governoratesTable, eq(officesTable.governorateId, governoratesTable.id))
    .leftJoin(subscriptionPlansTable, eq(officesTable.planId, subscriptionPlansTable.id))
    .where(eq(officesTable.id, officeId));

  if (!row) {
    res.status(404).json({ error: "Office not found" });
    return;
  }

  const [listingCount] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
    })
    .from(propertiesTable)
    .where(eq(propertiesTable.officeId, officeId));

  const [leadCount] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(eq(leadsTable.officeId, officeId));

  const officeBase = buildOfficeObject(row.office, {
    governorateName: row.governorateName ?? null,
    planName: row.planName ?? null,
    totalListings: Number(listingCount?.total ?? 0),
    activeListings: Number(listingCount?.active ?? 0),
  });

  res.json({
    ...GetOfficeResponse.parse({
      ...officeBase,
      totalViews: row.office.totalViews,
      totalLeads: Number(leadCount?.total ?? 0),
    }),
    // landingTemplate isn't part of the generated zod response schema yet, so
    // re-attach it after parse (the parse strips unknown keys).
    landingTemplate: officeBase.landingTemplate,
  });
});

router.get("/offices/:id/properties", async (req, res): Promise<void> => {
  const params = GetOfficePropertiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const qParams = GetOfficePropertiesQueryParams.safeParse(req.query);
  if (!qParams.success) {
    res.status(400).json({ error: qParams.error.message });
    return;
  }

  const officeId = params.data.id;
  const page = Number(qParams.data.page ?? 1);
  const limit = Number(qParams.data.limit ?? 12);
  const offset = (page - 1) * limit;

  // If the logged-in office owns this office, show all listings (including inactive/pending)
  const viewerOfficeId = await getOfficeId(req);
  const isOwner = viewerOfficeId !== null && viewerOfficeId === officeId;

  // Filters (read straight from the query — the generated zod schema only types
  // page/limit, so status/type would otherwise be silently dropped).
  const statusFilter = String((req.query as Record<string, unknown>).status ?? "").trim();
  const typeFilter = String((req.query as Record<string, unknown>).type ?? "").trim();
  const VALID_STATUSES = ["للإيجار", "للبيع", "للبدل"];

  const conditions = [eq(propertiesTable.officeId, officeId)];
  if (!isOwner) conditions.push(eq(propertiesTable.active, true));
  if (statusFilter && VALID_STATUSES.includes(statusFilter)) conditions.push(eq(propertiesTable.status, statusFilter));
  if (typeFilter) conditions.push(eq(propertiesTable.type, typeFilter));
  const whereClause = and(...conditions);

  const [propsRaw, totalRaw] = await Promise.all([
    db
      .select({
        property: propertiesTable,
        governorateName: governoratesTable.nameAr,
        areaName: areasTable.nameAr,
        officeName: officesTable.nameAr,
        officeLogo: officesTable.logo,
      })
      .from(propertiesTable)
      .leftJoin(governoratesTable, eq(propertiesTable.governorateId, governoratesTable.id))
      .leftJoin(areasTable, eq(propertiesTable.areaId, areasTable.id))
      .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
      .where(whereClause)
      .orderBy(desc(propertiesTable.featured), desc(propertiesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(propertiesTable).where(whereClause),
  ]);

  const propIds = propsRaw.map((p) => p.property.id);
  const images = propIds.length
    ? await db
        .select()
        .from(propertyImagesTable)
        .where(and(
          inArray(propertyImagesTable.propertyId, propIds),
          eq(propertyImagesTable.isPrimary, true)
        ))
    : [];

  const imageMap: Record<number, string> = {};
  for (const img of images) {
    const normalized = normalizeImageUrl(img.url);
    if (normalized) imageMap[img.propertyId] = normalized;
  }

  const total = Number(totalRaw[0]?.count ?? 0);
  const properties = propsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) => ({
    id: property.id,
    referenceId: property.referenceId,
    title: property.title,
    titleAr: property.titleAr,
    description: property.description ?? null,
    descriptionAr: property.descriptionAr ?? null,
    status: property.status,
    type: property.type,
    price: property.price,
    currency: property.currency,
    area: property.areaSize ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    furnished: property.furnished ?? null,
    featured: property.featured,
    active: property.active,
    views: property.views,
    whatsappClicks: property.whatsappClicks,
    callClicks: property.callClicks,
    governorateId: property.governorateId ?? null,
    governorateName: governorateName ?? null,
    areaId: property.areaId ?? null,
    areaName: areaName ?? null,
    officeId: property.officeId ?? null,
    officeName: officeName ?? null,
    officeLogo: officeLogo ?? null,
    primaryImage: imageMap[property.id] ?? null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  }));

  res.json(GetOfficePropertiesResponse.parse({
    properties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }));
});

router.get("/offices/:id/stats", async (req, res): Promise<void> => {
  const params = GetOfficeStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const officeId = params.data.id;

  const [listingStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
      featured: sql<number>`count(*) filter (where ${propertiesTable.featured} = true)`,
      totalViews: sql<number>`sum(${propertiesTable.views})`,
      whatsappClicks: sql<number>`sum(${propertiesTable.whatsappClicks})`,
      callClicks: sql<number>`sum(${propertiesTable.callClicks})`,
    })
    .from(propertiesTable)
    .where(eq(propertiesTable.officeId, officeId));

  const [leadStats] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(eq(leadsTable.officeId, officeId));

  const recentLeadsRaw = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.officeId, officeId))
    .orderBy(desc(leadsTable.createdAt))
    .limit(5);

  res.json(GetOfficeStatsResponse.parse({
    totalListings: Number(listingStats?.total ?? 0),
    activeListings: Number(listingStats?.active ?? 0),
    featuredListings: Number(listingStats?.featured ?? 0),
    totalViews: Number(listingStats?.totalViews ?? 0),
    totalLeads: Number(leadStats?.total ?? 0),
    whatsappClicks: Number(listingStats?.whatsappClicks ?? 0),
    callClicks: Number(listingStats?.callClicks ?? 0),
    recentLeads: recentLeadsRaw.map((l) => ({
      id: l.id,
      customerName: l.customerName,
      phone: l.phone,
      email: l.email ?? null,
      message: l.message ?? null,
      inquiryType: l.inquiryType,
      status: l.status,
      notes: l.notes ?? null,
      propertyId: l.propertyId ?? null,
      propertyTitle: null,
      propertyRef: null,
      officeId: l.officeId ?? null,
      sourcePage: l.sourcePage ?? null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
  }));
});

// PUT /api/offices/:id/logo — update office logo (authenticated office owner)
router.put("/offices/:id/logo", async (req: Request, res: Response): Promise<void> => {
  const officeId = parseInt(String(req.params.id), 10);
  if (!officeId) { res.status(400).json({ error: "معرّف المكتب غير صالح" }); return; }

  const myOfficeId = await getOfficeId(req);
  if (myOfficeId === null) { res.status(401).json({ error: "غير مسجّل الدخول كمكتب" }); return; }
  if (myOfficeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  // Logo is uploaded via the local-disk endpoint (/api/uploads/images),
  // which returns a relative URL like "/api/uploads/<filename>". Store it as-is.
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || !url.startsWith("/api/uploads/")) {
    res.status(400).json({ error: "url مطلوب" }); return;
  }

  await db.update(officesTable).set({ logo: url }).where(eq(officesTable.id, officeId));

  res.json({ logo: url });
});

// PUT /api/offices/:id/cover — update office cover image (authenticated owner)
router.put("/offices/:id/cover", async (req: Request, res: Response): Promise<void> => {
  const officeId = parseInt(String(req.params.id), 10);
  if (!officeId) { res.status(400).json({ error: "معرّف المكتب غير صالح" }); return; }

  const myOfficeId = await getOfficeId(req);
  if (myOfficeId === null) { res.status(401).json({ error: "غير مسجّل الدخول كمكتب" }); return; }
  if (myOfficeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string" || !url.startsWith("/api/uploads/")) {
    res.status(400).json({ error: "url مطلوب" }); return;
  }

  await db.update(officesTable).set({ coverImage: url }).where(eq(officesTable.id, officeId));

  res.json({ coverImage: url });
});

// PUT /api/offices/:id/profile — update name, slug, phone, whatsapp (authenticated owner)
router.put("/offices/:id/profile", async (req: Request, res: Response): Promise<void> => {
  const officeId = parseInt(String(req.params.id), 10);
  if (!officeId) { res.status(400).json({ error: "معرّف المكتب غير صالح" }); return; }

  const myOfficeId = await getOfficeId(req);
  if (myOfficeId === null) { res.status(401).json({ error: "غير مسجّل الدخول كمكتب" }); return; }
  if (myOfficeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  const { nameAr, slug, phone, whatsapp, officeDescription, landingTemplate } = req.body as {
    nameAr?: string; slug?: string; phone?: string; whatsapp?: string; officeDescription?: string; landingTemplate?: string;
  };

  // Fetch current office to check slugEdits
  const [current] = await db.select().from(officesTable).where(eq(officesTable.id, officeId)).limit(1);
  if (!current) { res.status(404).json({ error: "المكتب غير موجود" }); return; }

  const PHONE_RE = /^[9654]\d{7}$/;

  // Validate phone
  if (phone !== undefined && phone !== "") {
    if (!/^\d+$/.test(phone)) { res.status(400).json({ field: "phone", error: "رقم الموبايل يجب أن يحتوي على أرقام فقط" }); return; }
    if (phone.length !== 8) { res.status(400).json({ field: "phone", error: "رقم الموبايل يجب أن يكون 8 أرقام" }); return; }
    if (!PHONE_RE.test(phone)) { res.status(400).json({ field: "phone", error: "رقم الموبايل يجب أن يبدأ بـ 9 أو 6 أو 5 أو 4" }); return; }
  }

  // Validate whatsapp
  if (whatsapp !== undefined && whatsapp !== "") {
    if (!/^\d+$/.test(whatsapp)) { res.status(400).json({ field: "whatsapp", error: "رقم واتساب يجب أن يحتوي على أرقام فقط" }); return; }
    if (whatsapp.length !== 8) { res.status(400).json({ field: "whatsapp", error: "رقم واتساب يجب أن يكون 8 أرقام" }); return; }
    if (!PHONE_RE.test(whatsapp)) { res.status(400).json({ field: "whatsapp", error: "رقم واتساب يجب أن يبدأ بـ 9 أو 6 أو 5 أو 4" }); return; }
  }

  const updates: Partial<typeof officesTable.$inferInsert> = {};
  let newSlugEdits = current.slugEdits ?? 0;

  if (nameAr !== undefined && nameAr.trim()) updates.nameAr = nameAr.trim();
  if (phone !== undefined) updates.phone = phone || null;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp || null;
  if (officeDescription !== undefined) {
    const trimmed = officeDescription.trim().slice(0, 250);
    updates.descriptionAr = trimmed || null;
    updates.description = trimmed || null;
  }
  if (landingTemplate !== undefined && LANDING_TEMPLATES.includes(landingTemplate)) {
    updates.landingTemplate = landingTemplate;
  }

  // Slug (username) is chosen once — at registration or the first time it's set —
  // then it is fixed and can no longer be changed by the office.
  if (slug !== undefined && slug !== current.slug) {
    if (current.slug) {
      res.status(400).json({ field: "slug", error: "لا يمكن تغيير رابط الصفحة بعد تحديده" }); return;
    }
    const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
    if (!SLUG_RE.test(slug)) {
      res.status(400).json({ field: "slug", error: "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط" }); return;
    }
    const RESERVED = ["properties", "offices", "admin", "login", "register", "plans", "dashboard", "api", "health", "by-slug"];
    if (RESERVED.includes(slug)) {
      res.status(400).json({ field: "slug", error: "هذا الرابط محجوز ولا يمكن استخدامه" }); return;
    }
    // Check uniqueness
    const [existing] = await db.select({ id: officesTable.id }).from(officesTable).where(eq(officesTable.slug, slug)).limit(1);
    if (existing && existing.id !== officeId) {
      res.status(400).json({ field: "slug", error: "هذا الرابط مستخدم من مكتب آخر، الرجاء اختيار رابط مختلف" }); return;
    }
    updates.slug = slug;
    newSlugEdits += 1;
    updates.slugEdits = newSlugEdits;
  }

  if (Object.keys(updates).length === 0) {
    res.json({ success: true, slugEdits: newSlugEdits }); return;
  }

  await db.update(officesTable).set(updates).where(eq(officesTable.id, officeId));
  res.json({ success: true, slugEdits: newSlugEdits });
});

export default router;
