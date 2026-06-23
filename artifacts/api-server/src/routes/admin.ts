import { Router, type IRouter } from "express";
import { db, usersTable, officeUsersTable, officesTable, propertiesTable, propertyImagesTable, areasTable, governoratesTable, leadsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireAdmin } from "../lib/authHelpers";

const router: IRouter = Router();

// GET /api/admin/pending-offices
router.get("/admin/pending-offices", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const pendingUsers = await db
      .select({
        userId: officeUsersTable.id,
        userName: officeUsersTable.name,
        userEmail: officeUsersTable.email,
        userStatus: officeUsersTable.status,
        officeId: officesTable.id,
        officeName: officesTable.nameAr,
        officeSlug: officesTable.slug,
        officePhone: officesTable.phone,
        officeActive: officesTable.active,
        createdAt: officeUsersTable.createdAt,
      })
      .from(officeUsersTable)
      .innerJoin(officesTable, eq(officeUsersTable.officeId, officesTable.id))
      .where(eq(officeUsersTable.status, "pending"))
      .orderBy(officeUsersTable.createdAt);

    res.json({ offices: pendingUsers });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /api/admin/offices/:id/approve
router.post("/admin/offices/:id/approve", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const officeId = Number(req.params.id);
  if (!officeId) {
    res.status(400).json({ error: "معرف المكتب غير صالح" });
    return;
  }
  try {
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.update(officesTable).set({
      active: true,
      subscriptionPlan: "basic",
      subscriptionStatus: "trial",
      trialStartedAt,
      trialEndsAt,
    }).where(eq(officesTable.id, officeId));
    await db.update(officeUsersTable).set({ status: "active" }).where(eq(officeUsersTable.officeId, officeId));
    res.json({ message: "تم تفعيل المكتب وبدأت التجربة المجانية (7 أيام)" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /api/admin/offices/:id/reject
router.post("/admin/offices/:id/reject", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const officeId = Number(req.params.id);
  if (!officeId) {
    res.status(400).json({ error: "معرف المكتب غير صالح" });
    return;
  }
  try {
    await db.update(officesTable).set({ active: false }).where(eq(officesTable.id, officeId));
    await db.update(officeUsersTable).set({ status: "rejected" }).where(eq(officeUsersTable.officeId, officeId));
    res.json({ message: "تم رفض طلب المكتب" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/pending-listings — returns recent published listings (last 60) for monitoring
router.get("/admin/pending-listings", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const recent = await db
      .select({
        id: propertiesTable.id,
        titleAr: propertiesTable.titleAr,
        status: propertiesTable.status,
        type: propertiesTable.type,
        price: propertiesTable.price,
        approvalStatus: propertiesTable.approvalStatus,
        active: propertiesTable.active,
        createdAt: propertiesTable.createdAt,
        officeId: officesTable.id,
        officeName: officesTable.nameAr,
        imageUrl: propertyImagesTable.url,
        areaName: areasTable.nameAr,
        governorateName: governoratesTable.nameAr,
      })
      .from(propertiesTable)
      .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
      .leftJoin(
        propertyImagesTable,
        and(
          eq(propertyImagesTable.propertyId, propertiesTable.id),
          eq(propertyImagesTable.isPrimary, true),
        ),
      )
      .leftJoin(areasTable, eq(propertiesTable.areaId, areasTable.id))
      .leftJoin(governoratesTable, eq(propertiesTable.governorateId, governoratesTable.id))
      .orderBy(desc(propertiesTable.createdAt))
      .limit(60);

    const seen = new Set<number>();
    const unique = recent.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

    res.json({ listings: unique });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /api/admin/listings/:id/approve
router.post("/admin/listings/:id/approve", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const listingId = Number(req.params.id);
  if (!listingId) {
    res.status(400).json({ error: "معرف الإعلان غير صالح" });
    return;
  }
  try {
    await db
      .update(propertiesTable)
      .set({ active: true, approvalStatus: "approved" })
      .where(eq(propertiesTable.id, listingId));
    res.json({ message: "تم إلغاء الحظر ونشر الإعلان" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /api/admin/listings/:id/reject
router.post("/admin/listings/:id/reject", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const listingId = Number(req.params.id);
  if (!listingId) {
    res.status(400).json({ error: "معرف الإعلان غير صالح" });
    return;
  }
  try {
    await db
      .update(propertiesTable)
      .set({ active: false, approvalStatus: "rejected" })
      .where(eq(propertiesTable.id, listingId));
    res.json({ message: "تم حظر الإعلان بسبب انتهاك المحتوى" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/all-offices (for viewing all offices)
router.get("/admin/all-offices", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = await db
      .select({
        userId: officeUsersTable.id,
        userName: officeUsersTable.name,
        userEmail: officeUsersTable.email,
        userStatus: officeUsersTable.status,
        officeId: officesTable.id,
        officeName: officesTable.nameAr,
        officeActive: officesTable.active,
        createdAt: officeUsersTable.createdAt,
      })
      .from(officeUsersTable)
      .innerJoin(officesTable, eq(officeUsersTable.officeId, officesTable.id))
      .orderBy(officeUsersTable.createdAt);

    res.json({ offices: all });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/subscriptions — all offices with subscription data
router.get("/admin/subscriptions", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = await db
      .select({
        officeId: officesTable.id,
        officeName: officesTable.nameAr,
        officeSlug: officesTable.slug,
        officeActive: officesTable.active,
        subscriptionPlan: officesTable.subscriptionPlan,
        subscriptionStatus: officesTable.subscriptionStatus,
        trialStartedAt: officesTable.trialStartedAt,
        trialEndsAt: officesTable.trialEndsAt,
        userEmail: officeUsersTable.email,
      })
      .from(officesTable)
      .leftJoin(officeUsersTable, eq(officeUsersTable.officeId, officesTable.id))
      .orderBy(desc(officesTable.createdAt));

    const now = new Date();
    res.json({
      offices: all.map((row) => ({
        ...row,
        trialStartedAt: row.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
        trialDaysLeft: row.trialEndsAt
          ? Math.max(0, Math.ceil((row.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      })),
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// POST /api/admin/offices/:id/set-subscription — admin changes subscription status
router.post("/admin/offices/:id/set-subscription", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const officeId = Number(req.params.id);
  const { status } = req.body as { status?: string };
  const allowed = ["trial", "active", "pending_payment", "expired", "inactive"];

  if (!officeId || !status || !allowed.includes(status)) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }
  try {
    const updates: Record<string, unknown> = { subscriptionStatus: status };
    if (status === "trial") {
      updates.trialStartedAt = new Date();
      updates.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await db.update(officesTable).set(updates).where(eq(officesTable.id, officeId));
    res.json({ message: "تم تحديث حالة الاشتراك بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// GET /api/admin/analytics — comprehensive dashboard data
router.get("/admin/analytics", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    // ── 1. Overview counts ──────────────────────────────────────────────────
    const [[totalOfficesRow], [activeOfficesRow], [totalAdsRow], [pendingAdsRow], [totalUsersRow], [engagementRow]] =
      await Promise.all([
        db.select({ v: sql<number>`cast(count(*) as int)` }).from(officesTable),
        db.select({ v: sql<number>`cast(count(*) as int)` }).from(officesTable).where(eq(officesTable.active, true)),
        db.select({ v: sql<number>`cast(count(*) as int)` }).from(propertiesTable),
        db.select({ v: sql<number>`cast(count(*) as int)` }).from(propertiesTable).where(eq(propertiesTable.approvalStatus, "pending")),
        db.select({ v: sql<number>`cast(count(*) as int)` }).from(usersTable),
        db.select({
          totalViews: sql<number>`cast(coalesce(sum(views), 0) as int)`,
          totalWhatsapp: sql<number>`cast(coalesce(sum(whatsapp_clicks), 0) as int)`,
          totalCalls: sql<number>`cast(coalesce(sum(call_clicks), 0) as int)`,
        }).from(propertiesTable),
      ]);

    // ── 2. Office performance (per office) ──────────────────────────────────
    const officeStats = await db
      .select({
        officeId: officesTable.id,
        officeName: officesTable.nameAr,
        officeSlug: officesTable.slug,
        active: officesTable.active,
        subscriptionPlan: officesTable.subscriptionPlan,
        subscriptionStatus: officesTable.subscriptionStatus,
        trialStartedAt: officesTable.trialStartedAt,
        trialEndsAt: officesTable.trialEndsAt,
        officeCreatedAt: officesTable.createdAt,
        adsCount: sql<number>`cast(count(distinct ${propertiesTable.id}) as int)`,
        activeAdsCount: sql<number>`cast(count(distinct case when ${propertiesTable.approvalStatus} = 'approved' and ${propertiesTable.active} = true then ${propertiesTable.id} end) as int)`,
        totalViews: sql<number>`cast(coalesce(sum(${propertiesTable.views}), 0) as int)`,
        whatsappClicks: sql<number>`cast(coalesce(sum(${propertiesTable.whatsappClicks}), 0) as int)`,
        callClicks: sql<number>`cast(coalesce(sum(${propertiesTable.callClicks}), 0) as int)`,
        leadsCount: sql<number>`cast(count(distinct ${leadsTable.id}) as int)`,
        lastActivity: sql<string | null>`max(${propertiesTable.createdAt})`,
      })
      .from(officesTable)
      .leftJoin(propertiesTable, eq(propertiesTable.officeId, officesTable.id))
      .leftJoin(leadsTable, eq(leadsTable.officeId, officesTable.id))
      .groupBy(
        officesTable.id, officesTable.nameAr, officesTable.slug,
        officesTable.active, officesTable.subscriptionPlan,
        officesTable.subscriptionStatus, officesTable.trialStartedAt,
        officesTable.trialEndsAt, officesTable.createdAt,
      )
      .orderBy(desc(sql`coalesce(sum(${propertiesTable.views}), 0)`));

    // ── 3. Top viewed ads ───────────────────────────────────────────────────
    const topAds = await db
      .select({
        id: propertiesTable.id,
        titleAr: propertiesTable.titleAr,
        views: propertiesTable.views,
        whatsappClicks: propertiesTable.whatsappClicks,
        callClicks: propertiesTable.callClicks,
        price: propertiesTable.price,
        status: propertiesTable.status,
        type: propertiesTable.type,
        officeName: officesTable.nameAr,
        imageUrl: propertyImagesTable.url,
      })
      .from(propertiesTable)
      .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
      .leftJoin(
        propertyImagesTable,
        and(eq(propertyImagesTable.propertyId, propertiesTable.id), eq(propertyImagesTable.isPrimary, true)),
      )
      .where(eq(propertiesTable.approvalStatus, "approved"))
      .orderBy(desc(propertiesTable.views))
      .limit(10);

    // ── 4. Zero engagement ads ──────────────────────────────────────────────
    const zeroEngagementAds = await db
      .select({
        id: propertiesTable.id,
        titleAr: propertiesTable.titleAr,
        views: propertiesTable.views,
        createdAt: propertiesTable.createdAt,
        type: propertiesTable.type,
        officeName: officesTable.nameAr,
      })
      .from(propertiesTable)
      .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
      .where(
        and(
          eq(propertiesTable.approvalStatus, "approved"),
          eq(propertiesTable.active, true),
          sql`${propertiesTable.views} = 0`,
          sql`${propertiesTable.whatsappClicks} = 0`,
          sql`${propertiesTable.callClicks} = 0`,
        ),
      )
      .orderBy(propertiesTable.createdAt)
      .limit(20);

    // ── 5. Subscription breakdown ───────────────────────────────────────────
    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const subRows = await db
      .select({
        subscriptionStatus: officesTable.subscriptionStatus,
        trialEndsAt: officesTable.trialEndsAt,
      })
      .from(officesTable)
      .where(eq(officesTable.active, true));

    let subActive = 0, subTrial = 0, subExpiringSoon = 0, subExpired = 0, subInactive = 0;
    for (const row of subRows) {
      if (row.subscriptionStatus === "active") subActive++;
      else if (row.subscriptionStatus === "trial") {
        subTrial++;
        if (row.trialEndsAt && row.trialEndsAt <= sevenDaysFromNow && row.trialEndsAt > now) subExpiringSoon++;
        if (row.trialEndsAt && row.trialEndsAt <= now) subExpired++;
      } else if (row.subscriptionStatus === "expired" || row.subscriptionStatus === "pending_payment") subExpired++;
      else subInactive++;
    }

    // ── 6. Compose response ─────────────────────────────────────────────────
    res.json({
      overview: {
        totalOffices: totalOfficesRow.v,
        activeOffices: activeOfficesRow.v,
        totalAds: totalAdsRow.v,
        pendingAds: pendingAdsRow.v,
        totalUsers: totalUsersRow.v,
        totalViews: engagementRow.totalViews,
        totalWhatsapp: engagementRow.totalWhatsapp,
        totalCalls: engagementRow.totalCalls,
      },
      officeStats: officeStats.map((o) => {
        const engagementScore = o.totalViews + o.whatsappClicks * 3 + o.callClicks * 2 + o.leadsCount * 5;
        const daysSinceActivity = o.lastActivity
          ? Math.floor((Date.now() - new Date(o.lastActivity).getTime()) / 86400000)
          : null;
        const trialDaysLeft = o.trialEndsAt
          ? Math.max(0, Math.ceil((o.trialEndsAt.getTime() - Date.now()) / 86400000))
          : null;
        const memberDays = o.officeCreatedAt
          ? Math.floor((Date.now() - new Date(o.officeCreatedAt).getTime()) / 86400000)
          : null;
        return {
          ...o,
          trialStartedAt: o.trialStartedAt?.toISOString() ?? null,
          trialEndsAt: o.trialEndsAt?.toISOString() ?? null,
          officeCreatedAt: o.officeCreatedAt?.toISOString() ?? null,
          lastActivity: o.lastActivity ?? null,
          engagementScore,
          daysSinceActivity,
          trialDaysLeft,
          memberDays,
        };
      }),
      topAds,
      zeroEngagementAds,
      subscriptions: { active: subActive, trial: subTrial, expiringSoon: subExpiringSoon, expired: subExpired, inactive: subInactive },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
