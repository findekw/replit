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

  res.json(ListPlansResponse.parse(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      price: p.price,
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
  ));
});

export default router;
