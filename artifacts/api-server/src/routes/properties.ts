import { Router, type IRouter, type Request, type Response } from "express";
import { db, propertiesTable, propertyImagesTable, officesTable, governoratesTable, areasTable } from "@workspace/db";
import { eq, and, desc, asc, sql, count, gte, lte, inArray } from "drizzle-orm";
import { requireOfficeId, getOfficeId } from "../lib/authHelpers";
import { getSessionId } from "../lib/session";
import {
  ListPropertiesQueryParams,
  ListPropertiesResponse,
  GetFeaturedPropertiesResponse,
  GetLatestPropertiesQueryParams,
  GetLatestPropertiesResponse,
  GetPropertyParams,
  GetPropertyResponse,
  GetSimilarPropertiesParams,
  GetSimilarPropertiesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Freeze rule for public discovery: an office's listings are visible only while
// the office is active AND its trial/subscription hasn't lapsed. Trial offices
// freeze after trialEndsAt; subscribed offices freeze after subscriptionEndsAt.
// NULL end dates mean "no expiry" (e.g. grandfathered/active offices). This is a
// no-op for offices in good standing and hides ads (without deleting) once they
// lapse — they return on renewal.
function officeInGoodStanding() {
  return and(
    eq(officesTable.active, true),
    sql`(
      (${officesTable.subscriptionStatus} = 'trial' AND (${officesTable.trialEndsAt} IS NULL OR ${officesTable.trialEndsAt} > now()))
      OR (${officesTable.subscriptionStatus} <> 'trial' AND (${officesTable.subscriptionEndsAt} IS NULL OR ${officesTable.subscriptionEndsAt} > now()))
    )`,
  );
}

// Returns an Arabic error string if the area does not belong to the governorate,
// or null if the pair is valid. Both ids are expected to be non-null here.
async function validateAreaInGovernorate(governorateId: number, areaId: number): Promise<string | null> {
  const [area] = await db
    .select({ governorateId: areasTable.governorateId })
    .from(areasTable)
    .where(eq(areasTable.id, areaId))
    .limit(1);
  if (!area) return "المنطقة المختارة غير موجودة";
  if (area.governorateId !== governorateId) return "المنطقة المختارة لا تتبع المحافظة المحددة";
  return null;
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `/api${url}`;
  return url;
}

function buildPropertyObject(
  property: typeof propertiesTable.$inferSelect,
  extras: {
    governorateName?: string | null;
    areaName?: string | null;
    officeName?: string | null;
    officeLogo?: string | null;
    primaryImage?: string | null;
  }
) {
  return {
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
    approvalStatus: property.approvalStatus,
    views: property.views,
    whatsappClicks: property.whatsappClicks,
    callClicks: property.callClicks,
    governorateId: property.governorateId ?? null,
    governorateName: extras.governorateName ?? null,
    areaId: property.areaId ?? null,
    areaName: extras.areaName ?? null,
    officeId: property.officeId ?? null,
    officeName: extras.officeName ?? null,
    officeLogo: extras.officeLogo ?? null,
    primaryImage: extras.primaryImage ?? null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}

async function getPrimaryImages(propertyIds: number[]): Promise<Record<number, string>> {
  if (!propertyIds.length) return {};
  const images = await db
    .select()
    .from(propertyImagesTable)
    .where(and(
      inArray(propertyImagesTable.propertyId, propertyIds),
      eq(propertyImagesTable.isPrimary, true)
    ));
  const map: Record<number, string> = {};
  for (const img of images) {
    const normalized = normalizeImageUrl(img.url);
    if (normalized) map[img.propertyId] = normalized;
  }
  return map;
}

router.get("/properties", async (req, res): Promise<void> => {
  // type/areaId are read raw below to allow comma-separated multi-values; exclude
  // them from the generated single-value schema (which coerces areaId to a number
  // and would 400 on "12,17").
  const { type: _t, areaId: _a, ...schemaQuery } = req.query as Record<string, unknown>;
  const parsed = ListPropertiesQueryParams.safeParse(schemaQuery);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    status, governorateId,
    minPrice, maxPrice, bedrooms, bathrooms,
    furnished, featured, officeId, keyword,
    sort, page: rawPage, limit: rawLimit,
  } = parsed.data;

  // minArea / maxArea are not yet in the generated OpenAPI schema — read directly
  const minArea = req.query["minArea"] != null ? Number(req.query["minArea"]) : null;
  const maxArea = req.query["maxArea"] != null ? Number(req.query["maxArea"]) : null;

  // type / areaId accept multiple comma-separated values (multi-select filter);
  // read raw from the query to bypass the single-value generated schema.
  const types = String(req.query["type"] ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const areaIds = String(req.query["areaId"] ?? "").split(",").map((a) => Number(a.trim())).filter((n) => Number.isFinite(n) && n > 0);

  const page = Number(rawPage ?? 1);
  const limit = Number(rawLimit ?? 12);
  const offset = (page - 1) * limit;

  const conditions = [eq(propertiesTable.active, true)];
  // Freeze rule (see officeInGoodStanding): hide listings from offices that are
  // inactive or whose trial/subscription has lapsed, from public discovery.
  conditions.push(officeInGoodStanding()!);

  if (status != null) conditions.push(eq(propertiesTable.status, status));
  if (types.length === 1) conditions.push(eq(propertiesTable.type, types[0]));
  else if (types.length > 1) conditions.push(inArray(propertiesTable.type, types));
  if (governorateId != null) conditions.push(eq(propertiesTable.governorateId, Number(governorateId)));
  if (areaIds.length === 1) conditions.push(eq(propertiesTable.areaId, areaIds[0]));
  else if (areaIds.length > 1) conditions.push(inArray(propertiesTable.areaId, areaIds));
  if (minPrice != null) conditions.push(gte(propertiesTable.price, Number(minPrice)));
  if (maxPrice != null) conditions.push(lte(propertiesTable.price, Number(maxPrice)));
  if (minArea != null) conditions.push(gte(propertiesTable.areaSize, Number(minArea)));
  if (maxArea != null) conditions.push(lte(propertiesTable.areaSize, Number(maxArea)));
  if (bedrooms != null) conditions.push(eq(propertiesTable.bedrooms, Number(bedrooms)));
  if (bathrooms != null) conditions.push(eq(propertiesTable.bathrooms, Number(bathrooms)));
  if (furnished != null) conditions.push(eq(propertiesTable.furnished, furnished));
  if (featured === "true") conditions.push(eq(propertiesTable.featured, true));
  if (officeId != null) conditions.push(eq(propertiesTable.officeId, Number(officeId)));
  if (keyword != null && keyword.trim()) {
    conditions.push(sql`(${propertiesTable.titleAr} ilike ${'%' + keyword + '%'} or ${propertiesTable.descriptionAr} ilike ${'%' + keyword + '%'})`);
  }

  const whereClause = and(...conditions);

  let orderBy;
  if (sort === "price_asc") orderBy = asc(propertiesTable.price);
  else if (sort === "price_desc") orderBy = desc(propertiesTable.price);
  else orderBy = desc(propertiesTable.createdAt);

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
      .orderBy(desc(propertiesTable.featured), orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(propertiesTable).leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id)).where(whereClause),
  ]);

  const imageMap = await getPrimaryImages(propsRaw.map((p) => p.property.id));
  const total = Number(totalRaw[0]?.count ?? 0);

  res.json(ListPropertiesResponse.parse({
    properties: propsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) =>
      buildPropertyObject(property, {
        governorateName: governorateName ?? null,
        areaName: areaName ?? null,
        officeName: officeName ?? null,
        officeLogo: officeLogo ?? null,
        primaryImage: imageMap[property.id] ?? null,
      })
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }));
});

router.get("/properties/featured", async (_req, res): Promise<void> => {
  const propsRaw = await db
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
    .where(and(eq(propertiesTable.active, true), eq(propertiesTable.featured, true), officeInGoodStanding()))
    .orderBy(desc(propertiesTable.createdAt))
    .limit(8);

  const imageMap = await getPrimaryImages(propsRaw.map((p) => p.property.id));

  res.json(GetFeaturedPropertiesResponse.parse(
    propsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) =>
      buildPropertyObject(property, {
        governorateName: governorateName ?? null,
        areaName: areaName ?? null,
        officeName: officeName ?? null,
        officeLogo: officeLogo ?? null,
        primaryImage: imageMap[property.id] ?? null,
      })
    )
  ));
});

router.get("/properties/latest", async (req, res): Promise<void> => {
  const parsed = GetLatestPropertiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = Number(parsed.data.limit ?? 8);

  const propsRaw = await db
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
    .where(and(eq(propertiesTable.active, true), officeInGoodStanding()))
    .orderBy(desc(propertiesTable.createdAt))
    .limit(limit);

  const imageMap = await getPrimaryImages(propsRaw.map((p) => p.property.id));

  res.json(GetLatestPropertiesResponse.parse(
    propsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) =>
      buildPropertyObject(property, {
        governorateName: governorateName ?? null,
        areaName: areaName ?? null,
        officeName: officeName ?? null,
        officeLogo: officeLogo ?? null,
        primaryImage: imageMap[property.id] ?? null,
      })
    )
  ));
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const params = GetPropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const propId = params.data.id;

  const [row] = await db
    .select({
      property: propertiesTable,
      governorateName: governoratesTable.nameAr,
      areaName: areasTable.nameAr,
      officeName: officesTable.nameAr,
      officeLogo: officesTable.logo,
      officePhone: officesTable.phone,
      officeWhatsapp: officesTable.whatsapp,
    })
    .from(propertiesTable)
    .leftJoin(governoratesTable, eq(propertiesTable.governorateId, governoratesTable.id))
    .leftJoin(areasTable, eq(propertiesTable.areaId, areasTable.id))
    .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
    .where(eq(propertiesTable.id, propId));

  if (!row) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  // Count views only for real external visitors.
  // Skip if: (1) viewer is the property owner (office), (2) viewer is admin.
  let shouldCountView = true;
  const isAdminViewer = getSessionId(req, "admin") !== null;
  const viewerOfficeId = await getOfficeId(req);
  if (isAdminViewer || (viewerOfficeId !== null && viewerOfficeId === row.property.officeId)) {
    shouldCountView = false;
  }

  if (shouldCountView) {
    await db
      .update(propertiesTable)
      .set({ views: sql`${propertiesTable.views} + 1` })
      .where(eq(propertiesTable.id, propId));
  }

  const images = await db
    .select()
    .from(propertyImagesTable)
    .where(eq(propertyImagesTable.propertyId, propId))
    .orderBy(asc(propertyImagesTable.sortOrder));

  const primaryImage = normalizeImageUrl(images.find((img) => img.isPrimary)?.url ?? images[0]?.url ?? null);

  let officeObj = null;
  if (row.property.officeId) {
    const [office] = await db.select().from(officesTable).where(eq(officesTable.id, row.property.officeId));
    if (office) {
      officeObj = {
        id: office.id,
        name: office.name,
        nameAr: office.nameAr,
        slug: office.slug,
        description: office.description ?? null,
        descriptionAr: office.descriptionAr ?? null,
        logo: office.logo ?? null,
        coverImage: office.coverImage ?? null,
        phone: office.phone ?? null,
        whatsapp: office.whatsapp ?? null,
        email: office.email ?? null,
        website: office.website ?? null,
        instagram: office.instagram ?? null,
        twitter: office.twitter ?? null,
        governorateId: office.governorateId ?? null,
        governorateName: row.governorateName ?? null,
        verified: office.verified,
        featured: office.featured,
        active: office.active,
        totalListings: 0,
        activeListings: 0,
        planName: null,
        createdAt: office.createdAt.toISOString(),
      };
    }
  }

  const parsedProperty = GetPropertyResponse.parse({
    ...buildPropertyObject(row.property, {
      governorateName: row.governorateName ?? null,
      areaName: row.areaName ?? null,
      officeName: row.officeName ?? null,
      officeLogo: row.officeLogo ?? null,
      primaryImage,
    }),
    images: images.map((img) => ({
      id: img.id,
      url: normalizeImageUrl(img.url) ?? img.url,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    amenities: row.property.amenities,
    office: officeObj,
  });

  res.json({
    ...parsedProperty,
    videoUrl: row.property.videoUrl ?? null,
  });
});

router.get("/properties/:id/similar", async (req, res): Promise<void> => {
  const params = GetSimilarPropertiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const propId = params.data.id;

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId));
  if (!prop) {
    res.json(GetSimilarPropertiesResponse.parse([]));
    return;
  }

  const conditions = [
    eq(propertiesTable.active, true),
    sql`${propertiesTable.id} != ${propId}`,
  ];
  if (prop.type) conditions.push(eq(propertiesTable.type, prop.type));

  const propsRaw = await db
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
    .where(and(...conditions))
    .orderBy(desc(propertiesTable.createdAt))
    .limit(4);

  const imageMap = await getPrimaryImages(propsRaw.map((p) => p.property.id));

  res.json(GetSimilarPropertiesResponse.parse(
    propsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) =>
      buildPropertyObject(property, {
        governorateName: governorateName ?? null,
        areaName: areaName ?? null,
        officeName: officeName ?? null,
        officeLogo: officeLogo ?? null,
        primaryImage: imageMap[property.id] ?? null,
      })
    )
  ));
});

router.post("/properties", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const body = req.body as Record<string, unknown>;
  const titleAr = String(body.titleAr ?? "").trim();
  const status = String(body.status ?? "").trim();
  const type = String(body.type ?? "").trim();
  const price = Number(body.price ?? 0);
  const currency = "KWD";
  const areaSize = body.areaSize ? Number(body.areaSize) : null;
  const bedrooms = body.bedrooms ? Number(body.bedrooms) : null;
  const bathrooms = body.bathrooms ? Number(body.bathrooms) : null;
  const furnished = body.furnished ? String(body.furnished).trim() : null;
  const amenities = Array.isArray(body.amenities)
    ? body.amenities.map((a) => String(a).trim()).filter(Boolean).slice(0, 30)
    : [];
  const governorateId = body.governorateId ? Number(body.governorateId) : null;
  const areaId = body.areaId ? Number(body.areaId) : null;
  const descriptionAr = body.descriptionAr ? String(body.descriptionAr).trim() : null;

  const VALID_STATUSES = ["للإيجار", "للبيع", "للبدل"];
  const VALID_TYPES = ["بيت", "شقة", "قسيمة", "ارض", "دور", "محل", "مكتب", "مخزن", "مستودع", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية", "طلب"];

  const errors: string[] = [];
  if (titleAr.length < 5) errors.push("العنوان يجب أن يكون 5 أحرف على الأقل");
  if (!VALID_STATUSES.includes(status)) errors.push("نوع العرض غير صالح");
  if (!VALID_TYPES.includes(type)) errors.push("نوع العقار غير صالح");
  if (!price || price <= 0) errors.push("السعر يجب أن يكون رقماً موجباً");
  if (!governorateId) errors.push("يرجى اختيار المحافظة");
  if (!areaId) errors.push("يرجى اختيار المنطقة");
  if (!descriptionAr || descriptionAr.length < 10) errors.push("وصف الإعلان يجب أن يكون 10 أحرف على الأقل");

  if (errors.length > 0) {
    res.status(400).json({ error: "بيانات غير صالحة", details: errors });
    return;
  }

  // Verify the area actually belongs to the chosen governorate (defends against
  // tampered requests saving e.g. an area under the wrong governorate).
  const areaErr = await validateAreaInGovernorate(governorateId!, areaId!);
  if (areaErr) {
    res.status(400).json({ error: "بيانات غير صالحة", details: [areaErr] });
    return;
  }

  const referenceId = `FN-${Date.now().toString(36).toUpperCase()}`;

  req.log.info({ officeId, titleAr, status, type, price }, "Creating property");

  try {
    const [newProperty] = await db
      .insert(propertiesTable)
      .values({
        referenceId,
        title: titleAr,
        titleAr,
        description: descriptionAr,
        descriptionAr,
        status,
        type,
        price,
        currency,
        areaSize,
        bedrooms,
        bathrooms,
        furnished,
        amenities,
        governorateId,
        areaId,
        officeId,
        // Auto-approve: new listings go live immediately (client decision — an
        // AI moderation agent will handle review later). Admin can still hide.
        active: true,
        approvalStatus: "approved",
        featured: false,
      })
      .returning();

    req.log.info({ propertyId: newProperty.id }, "Property created");
    res.status(201).json({ property: newProperty });
  } catch (err) {
    req.log.error({ err }, "Failed to create property");
    console.error("Property insert error:", err);
    res.status(500).json({ error: "فشل إنشاء الإعلان، حاول مرة أخرى" });
  }
});

// PUT /api/properties/:id — update an existing property (authenticated owner)
router.put("/properties/:id", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.id), 10);
  if (!propId) { res.status(400).json({ error: "معرّف الإعلان غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop) { res.status(404).json({ error: "الإعلان غير موجود" }); return; }
  if (prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح بتعديل هذا الإعلان" }); return; }

  const body = req.body as Record<string, unknown>;
  const titleAr = String(body.titleAr ?? "").trim();
  const status = String(body.status ?? "").trim();
  const type = String(body.type ?? "").trim();
  const price = Number(body.price ?? 0);
  const areaSize = body.areaSize ? Number(body.areaSize) : null;
  const bedrooms = body.bedrooms ? Number(body.bedrooms) : null;
  const bathrooms = body.bathrooms ? Number(body.bathrooms) : null;
  const furnished = body.furnished ? String(body.furnished).trim() : null;
  const amenities = Array.isArray(body.amenities)
    ? body.amenities.map((a) => String(a).trim()).filter(Boolean).slice(0, 30)
    : [];
  const governorateId = body.governorateId ? Number(body.governorateId) : null;
  const areaId = body.areaId ? Number(body.areaId) : null;
  const descriptionAr = body.descriptionAr ? String(body.descriptionAr).trim() : null;

  const VALID_STATUSES = ["للإيجار", "للبيع", "للبدل"];
  const VALID_TYPES = ["بيت", "شقة", "قسيمة", "ارض", "دور", "محل", "مكتب", "مخزن", "مستودع", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية", "طلب"];

  const errors: string[] = [];
  if (titleAr.length < 5) errors.push("العنوان يجب أن يكون 5 أحرف على الأقل");
  if (!VALID_STATUSES.includes(status)) errors.push("نوع العرض غير صالح");
  if (!VALID_TYPES.includes(type)) errors.push("نوع العقار غير صالح");
  if (!price || price <= 0) errors.push("السعر يجب أن يكون رقماً موجباً");
  if (!governorateId) errors.push("يرجى اختيار المحافظة");
  if (!areaId) errors.push("يرجى اختيار المنطقة");
  if (!descriptionAr || descriptionAr.length < 10) errors.push("وصف الإعلان يجب أن يكون 10 أحرف على الأقل");

  if (errors.length > 0) { res.status(400).json({ error: "بيانات غير صالحة", details: errors }); return; }

  const areaErr = await validateAreaInGovernorate(governorateId!, areaId!);
  if (areaErr) { res.status(400).json({ error: "بيانات غير صالحة", details: [areaErr] }); return; }

  try {
    const [updated] = await db.update(propertiesTable).set({
      titleAr, title: titleAr, descriptionAr, description: descriptionAr,
      status, type, price, areaSize, bedrooms, bathrooms, furnished, amenities, governorateId, areaId,
      updatedAt: new Date(),
    }).where(eq(propertiesTable.id, propId)).returning();

    console.log(`[Properties] Updated property #${propId} by office #${officeId}`);
    res.json({ property: updated });
  } catch {
    res.status(500).json({ error: "فشل تحديث الإعلان، حاول مرة أخرى" });
  }
});

// PUT /api/properties/:id/video — attach or replace an optional property video
router.put("/properties/:id/video", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.id), 10);
  if (!propId) { res.status(400).json({ error: "معرّف الإعلان غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop) { res.status(404).json({ error: "الإعلان غير موجود" }); return; }
  if (prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح بتعديل هذا الإعلان" }); return; }

  const videoUrl = String((req.body as Record<string, unknown>).videoUrl ?? "").trim();
  if (!videoUrl.startsWith("/api/uploads/") && !videoUrl.startsWith("http://") && !videoUrl.startsWith("https://")) {
    res.status(400).json({ error: "رابط الفيديو غير صالح" });
    return;
  }

  const [updated] = await db.update(propertiesTable).set({
    videoUrl,
    updatedAt: new Date(),
  }).where(eq(propertiesTable.id, propId)).returning({ id: propertiesTable.id, videoUrl: propertiesTable.videoUrl });

  res.json({ property: updated });
});

// DELETE /api/properties/:id/video — remove the optional property video
router.delete("/properties/:id/video", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.id), 10);
  if (!propId) { res.status(400).json({ error: "معرّف الإعلان غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop || prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  await db.update(propertiesTable).set({ videoUrl: null, updatedAt: new Date() }).where(eq(propertiesTable.id, propId));
  res.json({ message: "تم حذف الفيديو" });
});

// DELETE /api/properties/:id — delete property and its images (authenticated owner)
router.delete("/properties/:id", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.id), 10);
  if (!propId) { res.status(400).json({ error: "معرّف الإعلان غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop) { res.status(404).json({ error: "الإعلان غير موجود" }); return; }
  if (prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح بحذف هذا الإعلان" }); return; }

  try {
    await db.delete(propertyImagesTable).where(eq(propertyImagesTable.propertyId, propId));
    await db.delete(propertiesTable).where(eq(propertiesTable.id, propId));
    console.log(`[Properties] Deleted property #${propId} by office #${officeId}`);
    res.json({ message: "تم حذف الإعلان بنجاح" });
  } catch {
    res.status(500).json({ error: "فشل حذف الإعلان، حاول مرة أخرى" });
  }
});

// DELETE /api/properties/:propertyId/images/:imageId — delete single image
router.delete("/properties/:propertyId/images/:imageId", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.propertyId), 10);
  const imgId = parseInt(String(req.params.imageId), 10);
  if (!propId || !imgId) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop || prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  const [img] = await db.select().from(propertyImagesTable)
    .where(and(eq(propertyImagesTable.id, imgId), eq(propertyImagesTable.propertyId, propId))).limit(1);
  if (!img) { res.status(404).json({ error: "الصورة غير موجودة" }); return; }

  await db.delete(propertyImagesTable).where(eq(propertyImagesTable.id, imgId));

  // If deleted was primary, promote the next image
  if (img.isPrimary) {
    const [next] = await db.select({ id: propertyImagesTable.id })
      .from(propertyImagesTable).where(eq(propertyImagesTable.propertyId, propId)).limit(1);
    if (next) {
      await db.update(propertyImagesTable).set({ isPrimary: true }).where(eq(propertyImagesTable.id, next.id));
    }
  }

  console.log(`[Images] Deleted image #${imgId} from property #${propId}`);
  res.json({ message: "تم حذف الصورة بنجاح" });
});

// PUT /api/properties/:propertyId/images/:imageId/primary — set primary image
router.put("/properties/:propertyId/images/:imageId/primary", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.propertyId), 10);
  const imgId = parseInt(String(req.params.imageId), 10);
  if (!propId || !imgId) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop || prop.officeId !== officeId) { res.status(403).json({ error: "غير مصرح" }); return; }

  await db.update(propertyImagesTable).set({ isPrimary: false }).where(eq(propertyImagesTable.propertyId, propId));
  await db.update(propertyImagesTable).set({ isPrimary: true }).where(eq(propertyImagesTable.id, imgId));

  console.log(`[Images] Set image #${imgId} as primary for property #${propId}`);
  res.json({ message: "تم تعيين الصورة الرئيسية بنجاح" });
});

// POST /api/properties/:id/images — save uploaded image objectPath to property_images
router.post("/properties/:id/images", async (req: Request, res: Response): Promise<void> => {
  const officeId = await requireOfficeId(req, res);
  if (officeId === null) return;

  const propId = parseInt(String(req.params.id), 10);
  if (!propId) { res.status(400).json({ error: "معرّف الإعلان غير صالح" }); return; }

  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propId)).limit(1);
  if (!prop || prop.officeId !== officeId) {
    res.status(403).json({ error: "غير مصرح لهذا الإعلان" }); return;
  }

  const { objectPath, url: directUrl, isPrimary } = req.body as {
    objectPath?: string;
    url?: string;
    isPrimary?: boolean;
  };

  const url = directUrl ?? (objectPath ? `/api/storage${objectPath}` : null);
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url أو objectPath مطلوب" }); return;
  }

  // If this is the first image or explicitly primary, unset others
  const existingImages = await db.select({ id: propertyImagesTable.id })
    .from(propertyImagesTable).where(eq(propertyImagesTable.propertyId, propId));

  const shouldBePrimary = isPrimary === true || existingImages.length === 0;

  if (shouldBePrimary) {
    await db.update(propertyImagesTable)
      .set({ isPrimary: false })
      .where(eq(propertyImagesTable.propertyId, propId));
  }

  const [img] = await db.insert(propertyImagesTable).values({
    propertyId: propId,
    url,
    isPrimary: shouldBePrimary,
    sortOrder: existingImages.length,
  }).returning();

  res.status(201).json({ image: img });
});

export default router;
