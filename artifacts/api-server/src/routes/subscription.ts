import { Router, type IRouter } from "express";
import { db, officesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireOffice, getOfficeId } from "../lib/authHelpers";

const router: IRouter = Router();

// GET /api/subscription/status — current office subscription info
router.get("/subscription/status", requireOffice, async (req: Request, res: Response): Promise<void> => {
  const officeId = await getOfficeId(req);

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
router.post("/subscription/request", requireOffice, async (req: Request, res: Response): Promise<void> => {
  const officeId = await getOfficeId(req);

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
