import { Router, type IRouter } from "express";
import { db, governoratesTable, areasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListGovernoratesResponse,
  ListAreasQueryParams,
  ListAreasResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/locations/governorates", async (_req, res): Promise<void> => {
  const governorates = await db
    .select()
    .from(governoratesTable)
    .where(eq(governoratesTable.active, true))
    .orderBy(governoratesTable.id);

  res.json(ListGovernoratesResponse.parse(
    governorates.map((g) => ({
      id: g.id,
      name: g.name,
      nameAr: g.nameAr,
      countryCode: g.countryCode,
    }))
  ));
});

router.get("/locations/areas", async (req, res): Promise<void> => {
  const parsed = ListAreasQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const govId = parsed.data.governorateId != null ? Number(parsed.data.governorateId) : null;

  const whereClause = govId != null
    ? and(eq(areasTable.active, true), eq(areasTable.governorateId, govId))
    : eq(areasTable.active, true);

  const areas = await db
    .select({
      id: areasTable.id,
      name: areasTable.name,
      nameAr: areasTable.nameAr,
      governorateId: areasTable.governorateId,
      governorateName: governoratesTable.nameAr,
    })
    .from(areasTable)
    .leftJoin(governoratesTable, eq(areasTable.governorateId, governoratesTable.id))
    .where(whereClause)
    .orderBy(areasTable.nameAr);

  res.json(ListAreasResponse.parse(
    areas.map((a) => ({
      id: a.id,
      name: a.name,
      nameAr: a.nameAr,
      governorateId: a.governorateId,
      governorateName: a.governorateName ?? null,
    }))
  ));
});

export default router;
