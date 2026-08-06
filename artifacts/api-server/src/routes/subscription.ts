import { Router, type IRouter } from "express";
import { db, officesTable, subscriptionPlansTable, paymentsTable, propertiesTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import type { Request, Response } from "express";
import { requireOffice, getOfficeId } from "../lib/authHelpers";
import { getTrialDays, getSetting } from "../lib/settings";

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
      subscriptionStartedAt: officesTable.subscriptionStartedAt,
      subscriptionEndsAt: officesTable.subscriptionEndsAt,
      planId: officesTable.planId,
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

  // Auto-expire a paid subscription once its period has ended.
  if (status === "active" && office.subscriptionEndsAt && office.subscriptionEndsAt < now) {
    await db
      .update(officesTable)
      .set({ subscriptionStatus: "expired" })
      .where(eq(officesTable.id, officeId));
    status = "expired";
  }

  // Published-listings usage + payment history (paid only).
  const [{ used }] = await db
    .select({ used: count() })
    .from(propertiesTable)
    .where(and(eq(propertiesTable.officeId, officeId), eq(propertiesTable.active, true)));
  const [pay] = await db
    .select({ cnt: count(), total: sum(paymentsTable.amountFils) })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.officeId, officeId), eq(paymentsTable.status, "paid")));
  const paymentsCount = Number(pay?.cnt ?? 0);

  // The office is on a PAID plan if it has an assigned plan (planId — set by a
  // payment or by an admin), or is active, has a paid-subscription end date, or
  // has paid before. A genuine trial with no assigned plan (planId null) still
  // shows the free plan. This makes the dashboard reflect the plan the office is
  // actually subscribed to instead of always defaulting to the free plan.
  const onPaidPlan = office.planId != null || status === "active" || office.subscriptionEndsAt != null || paymentsCount > 0;

  let planNameAr: string | null = "الباقة المجانية";
  let planPriceFils: number | null = null;
  let planDurationDays: number | null = await getTrialDays();
  let planMaxListings: number | null = Number(await getSetting("trial_max_listings", "5"));

  if (onPaidPlan && office.planId) {
    const [row] = await db
      .select({
        nameAr: subscriptionPlansTable.nameAr,
        price: subscriptionPlansTable.price,
        durationDays: subscriptionPlansTable.durationDays,
        maxListings: subscriptionPlansTable.maxListings,
      })
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.id, office.planId));
    if (row) {
      planNameAr = row.nameAr;
      planPriceFils = row.price;
      planDurationDays = row.durationDays;
      planMaxListings = row.maxListings;
    }
  }

  // One authoritative period so the banner and the card can never disagree.
  // A PAID plan has its OWN period of `planDurationDays` (e.g. 30) that is
  // SEPARATE from the free trial — the 14 trial days are never subtracted from
  // it. Its end is the real subscriptionEndsAt when set, otherwise the plan's
  // duration counted from the office's start date. A FREE trial uses the trial
  // window. Start/end/days-left all come from this single period.
  const DAY_MS = 1000 * 60 * 60 * 24;
  let periodStartedAt: Date | null = null;
  let periodEndsAt: Date | null = null;
  if (onPaidPlan) {
    // A paid plan uses its OWN recorded start/end. The start is the day the
    // office actually subscribed to THIS plan (independent of the free trial);
    // the end is the real end (set to the actual day on an early manual expiry).
    // Legacy rows without a recorded start fall back to end − duration.
    periodEndsAt = office.subscriptionEndsAt ?? null;
    periodStartedAt = office.subscriptionStartedAt
      ?? (office.subscriptionEndsAt && planDurationDays != null ? new Date(office.subscriptionEndsAt.getTime() - planDurationDays * DAY_MS) : null);
  } else {
    periodStartedAt = office.trialStartedAt ?? null;
    periodEndsAt = office.trialEndsAt ?? null;
  }
  // An expired / inactive subscription has no time left, whatever the stored end
  // date says (an admin can end it early). Otherwise count down to the period end.
  const isEnded = status === "expired" || status === "inactive";
  const daysLeft = isEnded
    ? 0
    : (periodEndsAt ? Math.max(0, Math.ceil((periodEndsAt.getTime() - now.getTime()) / DAY_MS)) : null);
  // An office on a paid plan counts as at least one subscription even if the
  // admin granted it without a recorded payment.
  const subscriptionsCount = onPaidPlan ? Math.max(1, paymentsCount) : paymentsCount;

  res.json({
    subscriptionPlan: office.subscriptionPlan,
    subscriptionStatus: status,
    trialStartedAt: office.trialStartedAt?.toISOString() ?? null,
    trialEndsAt: office.trialEndsAt?.toISOString() ?? null,
    subscriptionEndsAt: office.subscriptionEndsAt?.toISOString() ?? null,
    periodStartedAt: periodStartedAt?.toISOString() ?? null,
    periodEndsAt: periodEndsAt?.toISOString() ?? null,
    daysLeft,
    trialDaysLeft,
    canPublish: status === "trial" || status === "active",
    // Enriched fields for the dashboard subscription card
    isFreePlan: !onPaidPlan,
    planNameAr,
    planPriceFils,
    planDurationDays,
    planMaxListings,
    listingsUsed: Number(used ?? 0),
    paymentsCount,
    subscriptionsCount,
    paymentsTotalFils: Number(pay?.total ?? 0),
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
