import { Router, type IRouter } from "express";
import { db, officesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

const router: IRouter = Router();

async function getOfficeIdForUser(userId: number): Promise<number | null> {
  const [user] = await db
    .select({ officeId: usersTable.officeId })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user?.officeId ?? null;
}

function requireAuth(req: Request, res: Response, next: () => void): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }
  next();
}

// GET /api/subscription/status — current office subscription info
router.get("/subscription/status", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "يجب تسجيل الدخول" }); return; }
  const officeId = await getOfficeIdForUser(req.session.userId);

  if (!officeId) {
    res.status(404).json({ error: "لا يوجد مكتب مرتبط بهذا الحساب" });
    return;
  }

  const [office] = await db
    .select({
      subscriptionPlan: officesTable.subscriptionPlan,
      subscriptionStatus: officesTable.subscriptionStatus,
      trialStartedAt: officesTable.trialStartedAt,
      trialEndsAt: officesTable.trialEndsAt,
    })
    .from(officesTable)
    .where(eq(officesTable.id, officeId));

  if (!office) {
    res.status(404).json({ error: "المكتب غير موجود" });
    return;
  }

  const now = new Date();
  let trialDaysLeft: number | null = null;

  if (office.trialEndsAt) {
    const diff = office.trialEndsAt.getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  let status = office.subscriptionStatus;

  // Auto-expire trial if past end date
  if (status === "trial" && office.trialEndsAt && office.trialEndsAt < now) {
    await db
      .update(officesTable)
      .set({ subscriptionStatus: "expired" })
      .where(eq(officesTable.id, officeId));
    status = "expired";
    trialDaysLeft = 0;
  }

  res.json({
    subscriptionPlan: office.subscriptionPlan,
    subscriptionStatus: status,
    trialStartedAt: office.trialStartedAt?.toISOString() ?? null,
    trialEndsAt: office.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft,
    canPublish: status === "trial" || status === "active",
  });
});

// POST /api/subscription/request — office requests to subscribe
router.post("/subscription/request", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "يجب تسجيل الدخول" }); return; }
  const officeId = await getOfficeIdForUser(req.session.userId);

  if (!officeId) {
    res.status(404).json({ error: "لا يوجد مكتب مرتبط بهذا الحساب" });
    return;
  }

  await db
    .update(officesTable)
    .set({ subscriptionStatus: "pending_payment" })
    .where(eq(officesTable.id, officeId));

  res.json({ message: "تم استلام طلب اشتراكك. تواصل معنا لإكمال الدفع" });
});

export default router;
