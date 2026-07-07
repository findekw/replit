import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { db, officesTable, officeUsersTable, subscriptionPlansTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireOffice, getOfficeId } from "../lib/authHelpers";
import { createCharge, getPaymentStatusBySession, filsToKwdString, upaymentsConfigured } from "../lib/upayments";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PUBLIC_BASE = (process.env["PUBLIC_BASE_URL"] ?? "https://www.finde.co").replace(/\/+$/, "");

// Activate (or extend) an office subscription from a verified, captured payment.
// Idempotent: a second call for an already-paid order is a no-op.
async function activateFromPayment(paymentId: number): Promise<void> {
  await db.transaction(async (tx) => {
    const [pay] = await tx.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).for("update");
    if (!pay || pay.status === "paid") return; // already handled

    let durationDays = 30;
    let planName = "";
    if (pay.planId != null) {
      const [plan] = await tx.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, pay.planId));
      if (plan) { durationDays = plan.durationDays; planName = plan.nameAr; }
    }

    // Extend from the later of (now) and (current subscription end), so paying
    // early stacks the remaining time instead of losing it.
    const now = new Date();
    const [office] = await tx.select({ ends: officesTable.subscriptionEndsAt }).from(officesTable).where(eq(officesTable.id, pay.officeId));
    const base = office?.ends && office.ends > now ? office.ends : now;
    const endsAt = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await tx.update(officesTable).set({
      subscriptionStatus: "active",
      subscriptionPlan: planName || "premium",
      planId: pay.planId ?? undefined,
      subscriptionEndsAt: endsAt,
      active: true,
    }).where(eq(officesTable.id, pay.officeId));

    await tx.update(paymentsTable).set({ status: "paid", paidAt: now }).where(eq(paymentsTable.id, paymentId));
  });
}

// Verify a payment against UPayments and activate if captured. Returns the
// resolved status. Amount + order-ref are validated to prevent tampering.
async function reconcilePayment(pay: typeof paymentsTable.$inferSelect): Promise<"paid" | "pending" | "failed"> {
  if (pay.status === "paid") return "paid";
  if (!pay.sessionId) return "pending";

  const st = await getPaymentStatusBySession(pay.sessionId);
  if (!st.ok) return "pending";

  if (st.captured) {
    // Defense in depth: the amount and order ref returned by the gateway must
    // match what we recorded before we grant a subscription.
    const expected = filsToKwdString(pay.amountFils);
    const amountOk = st.totalPrice != null && Number(st.totalPrice) === Number(expected);
    const refOk = st.orderRef === pay.orderRef;
    const currencyOk = !st.currency || st.currency === pay.currency;
    if (!amountOk || !refOk || !currencyOk) {
      logger.error({ orderRef: pay.orderRef, st: { amount: st.totalPrice, ref: st.orderRef, currency: st.currency }, expected }, "payment verify mismatch");
      return "pending";
    }
    await db.update(paymentsTable).set({ rawStatus: st.result ?? "CAPTURED" }).where(eq(paymentsTable.id, pay.id));
    await activateFromPayment(pay.id);
    return "paid";
  }
  return "pending";
}

// POST /api/payments/subscribe — office starts a subscription payment for a plan.
router.post("/payments/subscribe", requireOffice, async (req: Request, res: Response): Promise<void> => {
  if (!upaymentsConfigured()) { res.status(503).json({ error: "بوابة الدفع غير مفعّلة حالياً" }); return; }

  const officeId = await getOfficeId(req);
  if (!officeId) { res.status(403).json({ error: "يجب أن تكون مكتباً عقارياً" }); return; }

  const planId = Number((req.body as { planId?: unknown })?.planId);
  if (!planId) { res.status(400).json({ error: "يجب اختيار باقة" }); return; }

  const [plan] = await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, planId));
  if (!plan || !plan.active) { res.status(404).json({ error: "الباقة غير متاحة" }); return; }
  // Amount is taken from the DB plan on the server — never from the client.
  if (plan.price <= 0) { res.status(400).json({ error: "سعر الباقة غير صالح" }); return; }

  const [office] = await db.select().from(officesTable).where(eq(officesTable.id, officeId));
  if (!office) { res.status(404).json({ error: "المكتب غير موجود" }); return; }
  const [ou] = await db.select({ email: officeUsersTable.email }).from(officeUsersTable).where(eq(officeUsersTable.officeId, officeId)).limit(1);

  const orderRef = `finde-${officeId}-${planId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const [pay] = await db.insert(paymentsTable).values({
    officeId,
    planId,
    orderRef,
    amountFils: plan.price,
    currency: plan.currency,
    status: "pending",
  }).returning();

  const charge = await createCharge({
    orderRef,
    amountFils: plan.price,
    productName: `اشتراك Finde — ${plan.nameAr}`,
    officeId,
    customerName: office.nameAr || office.name || "مكتب عقاري",
    customerEmail: ou?.email,
    customerMobile: office.phone || office.whatsapp || "",
    returnUrl: `${PUBLIC_BASE}/dashboard/subscribe?payment=success&ref=${encodeURIComponent(orderRef)}`,
    cancelUrl: `${PUBLIC_BASE}/dashboard/subscribe?payment=cancelled&ref=${encodeURIComponent(orderRef)}`,
    notificationUrl: `${PUBLIC_BASE}/api/payments/webhook`,
  });

  if (!charge.ok || !charge.link) {
    await db.update(paymentsTable).set({ status: "failed" }).where(eq(paymentsTable.id, pay.id));
    res.status(502).json({ error: charge.error || "تعذّر إنشاء عملية الدفع" });
    return;
  }

  await db.update(paymentsTable).set({ sessionId: charge.sessionId ?? null, paymentLink: charge.link }).where(eq(paymentsTable.id, pay.id));
  res.json({ link: charge.link });
});

// Extract our order reference from a UPayments webhook (fields vary by event).
function extractOrderRef(src: Record<string, any>): string | null {
  return (
    src.order_id ?? src.merchant_requested_order_id ?? src.reference ??
    src.orderId ?? src.OrderID ?? src.ref ?? null
  );
}

// POST/GET /api/payments/webhook — UPayments notification. This only TRIGGERS a
// re-verification; success is never taken from the request body itself.
async function handleWebhook(req: Request, res: Response): Promise<void> {
  const src = { ...(req.query as Record<string, any>), ...(req.body as Record<string, any>) };
  const orderRef = extractOrderRef(src);
  const sessionId = src.session_id ?? src.sessionId ?? null;

  try {
    let pay: typeof paymentsTable.$inferSelect | undefined;
    if (orderRef) [pay] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderRef, String(orderRef)));
    if (!pay && sessionId) [pay] = await db.select().from(paymentsTable).where(eq(paymentsTable.sessionId, String(sessionId)));

    if (pay) await reconcilePayment(pay);
    else logger.warn({ orderRef, sessionId }, "payment webhook: no matching order");
  } catch (err) {
    logger.error({ err }, "payment webhook error");
  }
  // Always 200 so UPayments doesn't retry forever; state is reconciled from our side.
  res.status(200).json({ received: true });
}
router.post("/payments/webhook", handleWebhook);
router.get("/payments/webhook", handleWebhook);

// GET /api/payments/verify?ref=… — called by the return page to confirm status.
router.get("/payments/verify", requireOffice, async (req: Request, res: Response): Promise<void> => {
  const officeId = await getOfficeId(req);
  if (!officeId) { res.status(403).json({ error: "يجب أن تكون مكتباً عقارياً" }); return; }

  const ref = String((req.query as { ref?: unknown }).ref ?? "");
  if (!ref) { res.status(400).json({ error: "مرجع غير صالح" }); return; }

  const [pay] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderRef, ref));
  if (!pay || pay.officeId !== officeId) { res.status(404).json({ error: "عملية الدفع غير موجودة" }); return; }

  const status = await reconcilePayment(pay);
  res.json({ status });
});

export default router;
