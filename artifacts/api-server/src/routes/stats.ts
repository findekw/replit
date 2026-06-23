import { Router, type IRouter } from "express";
import { db, propertiesTable, officesTable, leadsTable, governoratesTable } from "@workspace/db";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import {
  GetPlatformStatsResponse,
  GetDashboardStatsParams,
  GetDashboardStatsResponse,
} from "@workspace/api-zod";
import { propertyImagesTable, areasTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/platform", async (_req, res): Promise<void> => {
  const [propCount] = await db.select({ count: count() }).from(propertiesTable).where(eq(propertiesTable.active, true));
  const [officeCount] = await db.select({ count: count() }).from(officesTable).where(eq(officesTable.active, true));
  const [govCount] = await db.select({ count: count() }).from(governoratesTable).where(eq(governoratesTable.active, true));
  const [leadCount] = await db.select({ count: count() }).from(leadsTable);

  res.json(GetPlatformStatsResponse.parse({
    totalProperties: Number(propCount?.count ?? 0),
    totalOffices: Number(officeCount?.count ?? 0),
    totalCities: Number(govCount?.count ?? 0),
    totalLeads: Number(leadCount?.count ?? 0),
  }));
});

router.get("/stats/dashboard/:officeId", async (req, res): Promise<void> => {
  const params = GetDashboardStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const officeId = params.data.officeId;

  const [listingStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${propertiesTable.active} = true)`,
      featured: sql<number>`count(*) filter (where ${propertiesTable.featured} = true)`,
      totalViews: sql<number>`coalesce(sum(${propertiesTable.views}), 0)`,
      whatsappClicks: sql<number>`coalesce(sum(${propertiesTable.whatsappClicks}), 0)`,
      callClicks: sql<number>`coalesce(sum(${propertiesTable.callClicks}), 0)`,
    })
    .from(propertiesTable)
    .where(eq(propertiesTable.officeId, officeId));

  const [leadTotal] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(eq(leadsTable.officeId, officeId));

  const [newLeadCount] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(and(eq(leadsTable.officeId, officeId), eq(leadsTable.status, "جديد")));

  const recentLeadsRaw = await db
    .select({
      lead: leadsTable,
      propertyTitle: propertiesTable.titleAr,
      propertyRef: propertiesTable.referenceId,
    })
    .from(leadsTable)
    .leftJoin(propertiesTable, eq(leadsTable.propertyId, propertiesTable.id))
    .where(eq(leadsTable.officeId, officeId))
    .orderBy(desc(leadsTable.createdAt))
    .limit(5);

  const topPropsRaw = await db
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
    .where(and(eq(propertiesTable.officeId, officeId), eq(propertiesTable.active, true)))
    .orderBy(desc(propertiesTable.views))
    .limit(5);

  const propIds = topPropsRaw.map((p) => p.property.id);
  const images = propIds.length
    ? await db
        .select()
        .from(propertyImagesTable)
        .where(and(inArray(propertyImagesTable.propertyId, propIds), eq(propertyImagesTable.isPrimary, true)))
    : [];

  const imageMap: Record<number, string> = {};
  for (const img of images) {
    imageMap[img.propertyId] = img.url;
  }

  res.json(GetDashboardStatsResponse.parse({
    totalListings: Number(listingStats?.total ?? 0),
    activeListings: Number(listingStats?.active ?? 0),
    featuredListings: Number(listingStats?.featured ?? 0),
    totalViews: Number(listingStats?.totalViews ?? 0),
    totalLeads: Number(leadTotal?.total ?? 0),
    newLeads: Number(newLeadCount?.total ?? 0),
    whatsappClicks: Number(listingStats?.whatsappClicks ?? 0),
    callClicks: Number(listingStats?.callClicks ?? 0),
    recentLeads: recentLeadsRaw.map(({ lead, propertyTitle, propertyRef }) => ({
      id: lead.id,
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email ?? null,
      message: lead.message ?? null,
      inquiryType: lead.inquiryType,
      status: lead.status,
      notes: lead.notes ?? null,
      propertyId: lead.propertyId ?? null,
      propertyTitle: propertyTitle ?? null,
      propertyRef: propertyRef ?? null,
      officeId: lead.officeId ?? null,
      sourcePage: lead.sourcePage ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    })),
    topProperties: topPropsRaw.map(({ property, governorateName, areaName, officeName, officeLogo }) => ({
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
    })),
  }));
});

export default router;
