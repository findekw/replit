import { Router, type IRouter } from "express";
import { db, subscriptionPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListPlansResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(subscriptionPlansTable)
    .where(eq(subscriptionPlansTable.active, true))
    .orderBy(subscriptionPlansTable.price);

  const parsed = ListPlansResponse.parse(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      price: p.price / 1000, // stored in fils, exposed as KWD
      currency: p.currency,
      maxListings: p.maxListings,
      featuredListings: p.featuredListings,
      hasLeadDashboard: p.hasLeadDashboard,
      hasAnalytics: p.hasAnalytics,
      hasWhatsappSupport: p.hasWhatsappSupport,
      hasPriorityPlacement: p.hasPriorityPlacement,
      hasCustomProfile: p.hasCustomProfile,
      features: p.features,
    }))
  );
  // durationDays isn't in the generated schema (which strips unknown keys), and
  // plans are no longer all monthly — the client added a 45-day one. Re-attach
  // after parse, same pattern as offices.ts.
  res.json(parsed.map((p: { id: number }, i: number) => ({ ...p, durationDays: plans[i].durationDays })));
});

export default router;
