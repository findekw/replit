import { Router, type IRouter } from "express";
import { db, usersTable, officeUsersTable, officesTable, propertiesTable, propertyImagesTable, areasTable, governoratesTable, leadsTable, adminsTable, adminRolesTable, subscriptionPlansTable, catalogOptionsTable } from "@workspace/db";
import { eq, and, desc, asc, sql, like, inArray, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { requireAdmin } from "../lib/authHelpers";
import { getSessionId } from "../lib/session";
import { getTrialDays } from "../lib/settings";

const router: IRouter = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Role-based access ───────────────────────────────────────────────────────
// The owner (admins.role_id NULL) can do everything, including managing the
// admins and the roles themselves. Everyone else carries a role whose
// permissions are "section:action" strings (e.g. "listings:edit") — the owner
// picks per section what the employee may view/add/edit/delete. A bare section
// name (legacy roles created before actions existed) still grants the whole
// section. Enforced HERE, not just hidden in the UI — a keyed URL must fail too.
export const ADMIN_SECTION_ACTIONS = {
  offices:       ["view", "edit"],
  listings:      ["view", "edit"],
  reports:       ["view", "edit"],
  subscriptions: ["view", "add", "edit", "delete"],
  locations:     ["view", "add", "edit", "delete"],
  catalog:       ["view", "add", "edit", "delete"],
  tools:         ["view", "add", "edit", "delete"],
} as const;

export const ADMIN_PERMISSIONS: string[] = Object.entries(ADMIN_SECTION_ACTIONS)
  .flatMap(([section, actions]) => actions.map((a) => `${section}:${a}`));

const PERM_RULES: [RegExp, string][] = [
  [/^\/admin\/analytics/, "any"], // read-only overview: any signed-in admin
  [/^\/admin\/(admins|roles)/, "owner"],
  [/^\/admin\/offices\/\d+\/set-subscription/, "subscriptions"],
  [/^\/admin\/(subscriptions|plans)/, "subscriptions"],
  [/^\/admin\/(pending-offices|all-offices|offices)/, "offices"],
  [/^\/admin\/(pending-listings|listings)/, "listings"],
  [/^\/admin\/reports/, "reports"],
  [/^\/admin\/(locations|governorates|areas)/, "locations"],
  [/^\/admin\/catalog/, "catalog"],
  [/^\/admin\/(hero|demo-data|legal)/, "tools"],
  [/^\/admin\/settings/, "subscriptions"],
];

// POSTs that act on an existing record are edits, not adds; clearing demo data
// is a delete. Everything else follows the HTTP method.
const EDIT_POST_RE = /\/(approve|reject|set-subscription|reset-password)$/;
const METHOD_ACTION: Record<string, string> = { GET: "view", POST: "add", PUT: "edit", PATCH: "edit", DELETE: "delete" };

function requiredAction(req: Request): string {
  if (req.path === "/admin/demo-data/clear") return "delete";
  if (req.method === "POST" && EDIT_POST_RE.test(req.path)) return "edit";
  return METHOD_ACTION[req.method] ?? "edit";
}

router.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.path.startsWith("/admin")) { next(); return; }
  const adminId = getSessionId(req, "admin");
  if (!adminId) { next(); return; } // each route's requireAdmin rejects unauthenticated calls

  try {
    const [row] = await db
      .select({ roleId: adminsTable.roleId, permissions: adminRolesTable.permissions })
      .from(adminsTable)
      .leftJoin(adminRolesTable, eq(adminsTable.roleId, adminRolesTable.id))
      .where(eq(adminsTable.id, adminId))
      .limit(1);

    if (!row || row.roleId == null) { next(); return; } // owner (or vanished session — requireAdmin handles it)

    const need = (PERM_RULES.find(([re]) => re.test(req.path)) ?? [null, "owner"])[1];
    if (need === "any") { next(); return; }
    const perms = (row.permissions as string[] | null) ?? [];
    if (need === "owner") {
      res.status(403).json({ error: "ليست لديك صلاحية لهذا القسم" });
      return;
    }
    const action = requiredAction(req);
    if (!perms.includes(need) && !perms.includes(`${need}:${action}`)) {
      res.status(403).json({ error: action === "view" ? "ليست لديك صلاحية لهذا القسم" : "ليست لديك صلاحية لهذا الإجراء" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

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
    const trialDays = await getTrialDays();
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    await db.update(officesTable).set({
      active: true,
      subscriptionPlan: "basic",
      subscriptionStatus: "trial",
      trialStartedAt,
      trialEndsAt,
    }).where(eq(officesTable.id, officeId));
    await db.update(officeUsersTable).set({ status: "active" }).where(eq(officeUsersTable.officeId, officeId));
    res.json({ message: `تم تفعيل المكتب وبدأت التجربة المجانية (${trialDays} يوم)` });
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
        planId: officesTable.planId,
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
  const { status, planId } = req.body as { status?: string; planId?: number | string | null };
  const allowed = ["trial", "active", "pending_payment", "expired", "inactive"];

  if (!officeId || !status || !allowed.includes(status)) {
    res.status(400).json({ error: "بيانات غير صالحة" });
    return;
  }
  try {
    const updates: Record<string, unknown> = { subscriptionStatus: status };
    if (status === "trial") {
      updates.trialStartedAt = new Date();
      updates.trialEndsAt = new Date(Date.now() + (await getTrialDays()) * 24 * 60 * 60 * 1000);
    }
    // Activating a paid subscription should also make the office visible.
    if (status === "active") updates.active = true;

    // Optional plan assignment. When the admin picks a plan, link it (planId),
    // record its name, and set the subscription end date from the plan's
    // duration so the office dashboard shows the plan it's subscribed to.
    if (planId != null && planId !== "") {
      const pid = Number(planId);
      const [plan] = Number.isFinite(pid)
        ? await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, pid)).limit(1)
        : [];
      if (!plan) { res.status(400).json({ error: "الباقة غير موجودة" }); return; }
      updates.planId = plan.id;
      updates.subscriptionPlan = plan.nameAr;
      if (status === "active") {
        updates.subscriptionEndsAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      }
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

// ── POST /api/admin/offices/:id/reset-password — admin sets a new office password ──
router.post("/admin/offices/:id/reset-password", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const officeId = Number(req.params.id);
  const { password } = req.body as { password?: string };
  if (!officeId) { res.status(400).json({ error: "معرف المكتب غير صالح" }); return; }
  if (!password || password.length < 8) { res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }); return; }
  try {
    const [ou] = await db.select({ id: officeUsersTable.id }).from(officeUsersTable).where(eq(officeUsersTable.officeId, officeId)).limit(1);
    if (!ou) { res.status(404).json({ error: "لا يوجد حساب مرتبط بهذا المكتب" }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(officeUsersTable).set({ passwordHash }).where(eq(officeUsersTable.officeId, officeId));
    res.json({ message: "تم إعادة تعيين كلمة المرور بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── GET /api/admin/admins — list platform admins ──
router.get("/admin/admins", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const admins = await db
      .select({ id: adminsTable.id, name: adminsTable.name, email: adminsTable.email, status: adminsTable.status, createdAt: adminsTable.createdAt, roleId: adminsTable.roleId, roleName: adminRolesTable.nameAr })
      .from(adminsTable)
      .leftJoin(adminRolesTable, eq(adminsTable.roleId, adminRolesTable.id))
      .orderBy(adminsTable.createdAt);
    res.json({ admins });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── POST /api/admin/admins — create a new admin (owner only via the guard) ──
router.post("/admin/admins", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const name = String((req.body as any)?.name ?? "").trim();
  const email = String((req.body as any)?.email ?? "").trim().toLowerCase();
  const password = String((req.body as any)?.password ?? "");
  const roleIdRaw = (req.body as any)?.roleId;
  if (name.length < 2) { res.status(400).json({ error: "الاسم يجب أن يكون حرفين على الأقل" }); return; }
  if (!isValidEmail(email)) { res.status(400).json({ error: "البريد الإلكتروني غير صالح" }); return; }
  if (password.length < 8) { res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }); return; }
  try {
    let roleId: number | null = null;
    if (roleIdRaw != null && roleIdRaw !== "") {
      roleId = Number(roleIdRaw);
      const [role] = await db.select({ id: adminRolesTable.id }).from(adminRolesTable).where(eq(adminRolesTable.id, roleId)).limit(1);
      if (!role) { res.status(400).json({ error: "الدور غير موجود" }); return; }
    }
    const [existing] = await db.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    if (existing) { res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const [created] = await db.insert(adminsTable).values({ name, email, passwordHash, status: "active", roleId }).returning({ id: adminsTable.id, name: adminsTable.name, email: adminsTable.email });
    res.status(201).json({ admin: created, message: "تم إنشاء حساب المسؤول بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── PUT /api/admin/admins/:id/role — reassign an employee's role ──
router.put("/admin/admins/:id/role", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const roleIdRaw = (req.body as any)?.roleId;
  try {
    let roleId: number | null = null;
    if (roleIdRaw != null && roleIdRaw !== "") {
      roleId = Number(roleIdRaw);
      const [role] = await db.select({ id: adminRolesTable.id }).from(adminRolesTable).where(eq(adminRolesTable.id, roleId)).limit(1);
      if (!role) { res.status(400).json({ error: "الدور غير موجود" }); return; }
    }
    const [updated] = await db.update(adminsTable).set({ roleId }).where(eq(adminsTable.id, id)).returning({ id: adminsTable.id });
    if (!updated) { res.status(404).json({ error: "المسؤول غير موجود" }); return; }
    res.json({ message: "تم تحديث الدور" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── PUT /api/admin/admins/:id — edit an admin (owner only via the guard) ──
// Any subset of name / email / password / status. Password is optional: an
// empty value means "leave it unchanged" so an edit needn't reset it.
router.put("/admin/admins/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const [target] = await db.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.id, id)).limit(1);
    if (!target) { res.status(404).json({ error: "المسؤول غير موجود" }); return; }

    const patch: Record<string, unknown> = {};
    if (body["name"] !== undefined) {
      const name = String(body["name"]).trim();
      if (name.length < 2) { res.status(400).json({ error: "الاسم يجب أن يكون حرفين على الأقل" }); return; }
      patch["name"] = name;
    }
    if (body["email"] !== undefined) {
      const email = String(body["email"]).trim().toLowerCase();
      if (!isValidEmail(email)) { res.status(400).json({ error: "البريد الإلكتروني غير صالح" }); return; }
      const [clash] = await db.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
      if (clash && clash.id !== id) { res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" }); return; }
      patch["email"] = email;
    }
    if (body["password"] !== undefined && String(body["password"]) !== "") {
      const password = String(body["password"]);
      if (password.length < 8) { res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }); return; }
      patch["passwordHash"] = await bcrypt.hash(password, 12);
    }
    if (body["status"] !== undefined) {
      const status = String(body["status"]);
      if (status !== "active" && status !== "suspended") { res.status(400).json({ error: "حالة غير صالحة" }); return; }
      // An owner suspending themselves would immediately lock them out.
      if (status === "suspended" && id === getSessionId(req, "admin")) { res.status(400).json({ error: "لا يمكنك تعطيل حسابك الحالي" }); return; }
      patch["status"] = status;
    }
    if (!Object.keys(patch).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }

    const [updated] = await db.update(adminsTable).set(patch).where(eq(adminsTable.id, id))
      .returning({ id: adminsTable.id, name: adminsTable.name, email: adminsTable.email, status: adminsTable.status });
    res.json({ admin: updated, message: "تم تحديث بيانات المسؤول" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── DELETE /api/admin/admins/:id — remove an admin (owner only via the guard) ──
router.delete("/admin/admins/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  if (id === getSessionId(req, "admin")) { res.status(400).json({ error: "لا يمكنك حذف حسابك الحالي" }); return; }
  try {
    const [target] = await db.select({ id: adminsTable.id, roleId: adminsTable.roleId }).from(adminsTable).where(eq(adminsTable.id, id)).limit(1);
    if (!target) { res.status(404).json({ error: "المسؤول غير موجود" }); return; }
    // Never delete the last owner (role_id NULL) — it would lock everyone out.
    if (target.roleId == null) {
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(adminsTable).where(isNull(adminsTable.roleId));
      if (n <= 1) { res.status(400).json({ error: "لا يمكن حذف آخر مالك للمنصة" }); return; }
    }
    await db.delete(adminsTable).where(eq(adminsTable.id, id));
    res.json({ message: "تم حذف المسؤول" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Roles CRUD (owner only via the guard) ──
router.get("/admin/roles", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await db.select().from(adminRolesTable).orderBy(asc(adminRolesTable.id));
    const counts = await db
      .select({ roleId: adminsTable.roleId, n: sql<number>`count(*)::int` })
      .from(adminsTable)
      .groupBy(adminsTable.roleId);
    const byRole = new Map((counts as { roleId: number | null; n: number }[]).map((c) => [c.roleId, c.n]));
    res.json({
      roles: roles.map((r: typeof adminRolesTable.$inferSelect) => ({ ...r, admins: byRole.get(r.id) ?? 0 })),
      allPermissions: ADMIN_PERMISSIONS,
      sectionActions: ADMIN_SECTION_ACTIONS,
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.post("/admin/roles", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const nameAr = String((req.body as any)?.nameAr ?? "").trim();
  const permissions = Array.isArray((req.body as any)?.permissions)
    ? ((req.body as any).permissions as unknown[]).map(String).filter((p) => (ADMIN_PERMISSIONS as readonly string[]).includes(p))
    : [];
  if (!nameAr) { res.status(400).json({ error: "اسم الدور مطلوب" }); return; }
  if (!permissions.length) { res.status(400).json({ error: "اختر صلاحية واحدة على الأقل" }); return; }
  try {
    const [role] = await db.insert(adminRolesTable).values({ nameAr, permissions }).returning();
    res.status(201).json({ role });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/roles/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const patch: Record<string, unknown> = {};
  if ((req.body as any)?.nameAr !== undefined) {
    const v = String((req.body as any).nameAr).trim();
    if (!v) { res.status(400).json({ error: "اسم الدور مطلوب" }); return; }
    patch["nameAr"] = v;
  }
  if ((req.body as any)?.permissions !== undefined) {
    const perms = Array.isArray((req.body as any).permissions)
      ? ((req.body as any).permissions as unknown[]).map(String).filter((p) => (ADMIN_PERMISSIONS as readonly string[]).includes(p))
      : [];
    if (!perms.length) { res.status(400).json({ error: "اختر صلاحية واحدة على الأقل" }); return; }
    patch["permissions"] = perms;
  }
  if (!Object.keys(patch).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }
  try {
    const [role] = await db.update(adminRolesTable).set(patch).where(eq(adminRolesTable.id, id)).returning();
    if (!role) { res.status(404).json({ error: "الدور غير موجود" }); return; }
    res.json({ role });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/admin/roles/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    const [assigned] = await db.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.roleId, id)).limit(1);
    if (assigned) { res.status(409).json({ error: "الدور مُسند لموظفين. انقلهم لدور آخر أولاً." }); return; }
    const [role] = await db.delete(adminRolesTable).where(eq(adminRolesTable.id, id)).returning();
    if (!role) { res.status(404).json({ error: "الدور غير موجود" }); return; }
    res.json({ message: "تم حذف الدور" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── POST /api/admin/demo-data/clear — remove seeded demo content (FN-D* listings) ──
// Deletes demo properties (reference_id starting with "FN-D"), their images, and
// any leads attached to them. Office accounts are kept so logins keep working.
router.post("/admin/demo-data/clear", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const demoProps = await db.select({ id: propertiesTable.id }).from(propertiesTable).where(like(propertiesTable.referenceId, "FN-D%"));
    const ids = demoProps.map((p) => p.id);
    if (ids.length === 0) { res.json({ message: "لا توجد بيانات تجريبية", deletedProperties: 0, deletedLeads: 0 }); return; }
    const delLeads = await db.delete(leadsTable).where(inArray(leadsTable.propertyId, ids)).returning({ id: leadsTable.id });
    await db.delete(propertyImagesTable).where(inArray(propertyImagesTable.propertyId, ids));
    await db.delete(propertiesTable).where(inArray(propertiesTable.id, ids));
    res.json({ message: `تم مسح ${ids.length} عقار تجريبي`, deletedProperties: ids.length, deletedLeads: delLeads.length });
  } catch (err) {
    console.error("clear demo error:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Subscription plans (packages) — admin CRUD ───────────────────────────────
// Prices are entered/returned in KWD but stored in fils (KWD * 1000) so decimals
// like 14.5 are exact.
function planFromBody(body: any): {
  ok: true; value: Record<string, unknown>;
} | { ok: false; error: string } {
  const nameAr = String(body?.nameAr ?? "").trim();
  if (nameAr.length < 2) return { ok: false, error: "اسم الباقة مطلوب" };
  const priceKwd = Number(body?.priceKwd ?? body?.price);
  if (!isFinite(priceKwd) || priceKwd < 0) return { ok: false, error: "سعر غير صالح" };
  const durationDays = Math.max(1, Math.round(Number(body?.durationDays) || 30));
  const maxListings = Math.max(0, Math.round(Number(body?.maxListings) || 10));
  const featuredListings = Math.max(0, Math.round(Number(body?.featuredListings) || 0));
  const features = Array.isArray(body?.features) ? body.features.map((f: unknown) => String(f)).filter(Boolean) : [];
  return {
    ok: true,
    value: {
      name: String(body?.name ?? nameAr).trim() || nameAr,
      nameAr,
      price: Math.round(priceKwd * 1000),
      currency: "KWD",
      durationDays,
      maxListings,
      featuredListings,
      hasLeadDashboard: !!body?.hasLeadDashboard,
      hasAnalytics: !!body?.hasAnalytics,
      hasWhatsappSupport: !!body?.hasWhatsappSupport,
      hasPriorityPlacement: !!body?.hasPriorityPlacement,
      hasCustomProfile: !!body?.hasCustomProfile,
      features,
      active: body?.active !== false,
    },
  };
}

function planToApi(p: typeof subscriptionPlansTable.$inferSelect) {
  return { ...p, priceKwd: p.price / 1000 };
}

router.get("/admin/plans", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await db.select().from(subscriptionPlansTable).orderBy(subscriptionPlansTable.price);
    res.json({ plans: plans.map(planToApi) });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.post("/admin/plans", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = planFromBody(req.body);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  try {
    const [created] = await db.insert(subscriptionPlansTable).values(parsed.value as any).returning();
    res.status(201).json({ plan: planToApi(created), message: "تم إنشاء الباقة" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/plans/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const parsed = planFromBody(req.body);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  try {
    const [updated] = await db.update(subscriptionPlansTable).set(parsed.value as any).where(eq(subscriptionPlansTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "الباقة غير موجودة" }); return; }
    res.json({ plan: planToApi(updated), message: "تم تحديث الباقة" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/admin/plans/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    await db.delete(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, id));
    res.json({ message: "تم حذف الباقة" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Locations: governorates + areas ─────────────────────────────────────────
// Kuwait's areas do change (new blocks open, names get corrected), and until
// now editing one meant a code deploy. Deletes are refused while anything still
// points at the row — deactivate instead, which hides it from search without
// orphaning existing listings.

router.get("/admin/locations", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const govs = await db.select().from(governoratesTable).orderBy(governoratesTable.id);
    const areas = await db.select().from(areasTable).orderBy(areasTable.nameAr);
    const counts = await db
      .select({ areaId: propertiesTable.areaId, n: sql<number>`count(*)::int` })
      .from(propertiesTable)
      .groupBy(propertiesTable.areaId);
    const byArea = new Map(counts.map((c: { areaId: number | null; n: number }) => [c.areaId, c.n]));

    res.json({
      governorates: govs.map((g: typeof governoratesTable.$inferSelect) => ({
        ...g,
        areas: areas
          .filter((a: typeof areasTable.$inferSelect) => a.governorateId === g.id)
          .map((a: typeof areasTable.$inferSelect) => ({ ...a, listings: byArea.get(a.id) ?? 0 })),
      })),
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.post("/admin/governorates", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const nameAr = String(req.body?.nameAr ?? "").trim();
  const name = String(req.body?.name ?? "").trim() || nameAr;
  if (!nameAr) { res.status(400).json({ error: "اسم المحافظة مطلوب" }); return; }
  try {
    const [row] = await db.insert(governoratesTable).values({ name, nameAr }).returning();
    res.status(201).json({ governorate: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/governorates/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const patch: Record<string, unknown> = {};
  if (req.body?.nameAr !== undefined) {
    const v = String(req.body.nameAr).trim();
    if (!v) { res.status(400).json({ error: "اسم المحافظة مطلوب" }); return; }
    patch["nameAr"] = v;
  }
  if (req.body?.name !== undefined) patch["name"] = String(req.body.name).trim();
  if (req.body?.active !== undefined) patch["active"] = Boolean(req.body.active);
  if (!Object.keys(patch).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }

  try {
    const [row] = await db.update(governoratesTable).set(patch).where(eq(governoratesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "المحافظة غير موجودة" }); return; }
    res.json({ governorate: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/admin/governorates/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    const [area] = await db.select({ id: areasTable.id }).from(areasTable).where(eq(areasTable.governorateId, id)).limit(1);
    if (area) { res.status(409).json({ error: "لا يمكن حذف محافظة بها مناطق. احذف مناطقها أولاً أو عطّلها." }); return; }
    const [row] = await db.delete(governoratesTable).where(eq(governoratesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "المحافظة غير موجودة" }); return; }
    res.json({ message: "تم حذف المحافظة" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.post("/admin/areas", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const nameAr = String(req.body?.nameAr ?? "").trim();
  const name = String(req.body?.name ?? "").trim() || nameAr;
  const governorateId = Number(req.body?.governorateId);
  if (!nameAr) { res.status(400).json({ error: "اسم المنطقة مطلوب" }); return; }
  if (!Number.isFinite(governorateId)) { res.status(400).json({ error: "المحافظة مطلوبة" }); return; }
  try {
    const [gov] = await db.select({ id: governoratesTable.id }).from(governoratesTable).where(eq(governoratesTable.id, governorateId)).limit(1);
    if (!gov) { res.status(400).json({ error: "المحافظة غير موجودة" }); return; }
    const [row] = await db.insert(areasTable).values({ name, nameAr, governorateId }).returning();
    res.status(201).json({ area: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/areas/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const patch: Record<string, unknown> = {};
  if (req.body?.nameAr !== undefined) {
    const v = String(req.body.nameAr).trim();
    if (!v) { res.status(400).json({ error: "اسم المنطقة مطلوب" }); return; }
    patch["nameAr"] = v;
  }
  if (req.body?.name !== undefined) patch["name"] = String(req.body.name).trim();
  if (req.body?.active !== undefined) patch["active"] = Boolean(req.body.active);
  if (req.body?.governorateId !== undefined) {
    const g = Number(req.body.governorateId);
    if (!Number.isFinite(g)) { res.status(400).json({ error: "المحافظة غير صالحة" }); return; }
    patch["governorateId"] = g;
  }
  if (!Object.keys(patch).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }

  try {
    const [row] = await db.update(areasTable).set(patch).where(eq(areasTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "المنطقة غير موجودة" }); return; }
    res.json({ area: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/admin/areas/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    const [used] = await db.select({ id: propertiesTable.id }).from(propertiesTable).where(eq(propertiesTable.areaId, id)).limit(1);
    if (used) { res.status(409).json({ error: "لا يمكن حذف منطقة بها إعلانات. عطّلها بدلاً من ذلك لإخفائها من البحث." }); return; }
    const [row] = await db.delete(areasTable).where(eq(areasTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "المنطقة غير موجودة" }); return; }
    res.json({ message: "تم حذف المنطقة" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ── Catalog: furnishing states + amenities ──────────────────────────────────
// Admin-editable versions of lists the add-listing form used to hardcode. Like
// areas, values are stored on listings as their Arabic label, so renaming here
// doesn't rewrite existing listings — deactivate to hide from the picker.

const CATALOG_KINDS = new Set(["furnished", "amenity", "lead_status"]);

router.get("/admin/catalog", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(catalogOptionsTable)
      .orderBy(asc(catalogOptionsTable.kind), asc(catalogOptionsTable.sortOrder), asc(catalogOptionsTable.id));

    // How many records reference each label, per kind, so the UI can warn
    // before a delete. amenities is a text[]; furnished is a single text;
    // lead_status counts CRM leads instead of listings.
    const props = await db
      .select({ furnished: propertiesTable.furnished, amenities: propertiesTable.amenities })
      .from(propertiesTable);

    const furnishedUse = new Map<string, number>();
    const amenityUse = new Map<string, number>();
    for (const p of props as { furnished: string | null; amenities: string[] | null }[]) {
      if (p.furnished) furnishedUse.set(p.furnished, (furnishedUse.get(p.furnished) ?? 0) + 1);
      for (const a of p.amenities ?? []) amenityUse.set(a, (amenityUse.get(a) ?? 0) + 1);
    }

    const leadStatusRows = await db
      .select({ status: leadsTable.status, n: sql<number>`count(*)::int` })
      .from(leadsTable)
      .groupBy(leadsTable.status);
    const leadStatusUse = new Map<string, number>(
      (leadStatusRows as { status: string; n: number }[]).map((r) => [r.status, r.n]),
    );

    res.json({
      options: rows.map((r: typeof catalogOptionsTable.$inferSelect) => ({
        ...r,
        listings:
          (r.kind === "furnished" ? furnishedUse : r.kind === "lead_status" ? leadStatusUse : amenityUse).get(r.nameAr) ?? 0,
      })),
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.post("/admin/catalog", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const kind = String(req.body?.kind ?? "");
  const nameAr = String(req.body?.nameAr ?? "").trim();
  if (!CATALOG_KINDS.has(kind)) { res.status(400).json({ error: "نوع القائمة غير صالح" }); return; }
  if (!nameAr) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
  try {
    // No duplicate labels within a kind.
    const [dupe] = await db
      .select({ id: catalogOptionsTable.id })
      .from(catalogOptionsTable)
      .where(and(eq(catalogOptionsTable.kind, kind), eq(catalogOptionsTable.nameAr, nameAr)))
      .limit(1);
    if (dupe) { res.status(409).json({ error: "هذا الخيار موجود بالفعل" }); return; }

    const [{ max } = { max: 0 }] = await db
      .select({ max: sql<number>`coalesce(max(${catalogOptionsTable.sortOrder}), 0)::int` })
      .from(catalogOptionsTable)
      .where(eq(catalogOptionsTable.kind, kind));

    const [row] = await db
      .insert(catalogOptionsTable)
      .values({ kind, nameAr, sortOrder: (max ?? 0) + 1 })
      .returning();
    res.status(201).json({ option: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.put("/admin/catalog/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const patch: Record<string, unknown> = {};
  if (req.body?.nameAr !== undefined) {
    const v = String(req.body.nameAr).trim();
    if (!v) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
    patch["nameAr"] = v;
  }
  if (req.body?.active !== undefined) patch["active"] = Boolean(req.body.active);
  if (req.body?.sortOrder !== undefined) patch["sortOrder"] = Number(req.body.sortOrder);
  if (!Object.keys(patch).length) { res.status(400).json({ error: "لا يوجد تغيير" }); return; }

  try {
    const [row] = await db.update(catalogOptionsTable).set(patch).where(eq(catalogOptionsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "الخيار غير موجود" }); return; }
    res.json({ option: row });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/admin/catalog/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  try {
    const [row] = await db.select().from(catalogOptionsTable).where(eq(catalogOptionsTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "الخيار غير موجود" }); return; }

    // Refuse if records still reference this label — deactivate instead.
    const opt = row as typeof catalogOptionsTable.$inferSelect;
    let used: boolean;
    if (opt.kind === "lead_status") {
      const [hit] = await db.select({ id: leadsTable.id }).from(leadsTable).where(eq(leadsTable.status, opt.nameAr)).limit(1);
      used = !!hit;
      if (used) { res.status(409).json({ error: "هذه الحالة مستخدمة لعملاء حاليين. عطّلها بدلاً من حذفها." }); return; }
    } else {
      const props = await db
        .select({ furnished: propertiesTable.furnished, amenities: propertiesTable.amenities })
        .from(propertiesTable);
      used = (props as { furnished: string | null; amenities: string[] | null }[]).some((p) =>
        opt.kind === "furnished" ? p.furnished === opt.nameAr : (p.amenities ?? []).includes(opt.nameAr),
      );
      if (used) { res.status(409).json({ error: "هذا الخيار مستخدم في إعلانات. عطّله بدلاً من حذفه." }); return; }
    }

    await db.delete(catalogOptionsTable).where(eq(catalogOptionsTable.id, id));
    res.json({ message: "تم حذف الخيار" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
