import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import propertiesRouter from "./properties";
import officesRouter from "./offices";
import leadsRouter from "./leads";
import locationsRouter from "./locations";
import plansRouter from "./plans";
import statsRouter from "./stats";
import adminRouter from "./admin";
import storageRouter from "./storage";
import subscriptionRouter from "./subscription";
import uploadsRouter from "./uploads";
import heroRouter from "./hero";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(propertiesRouter);
router.use(officesRouter);
router.use(leadsRouter);
router.use(locationsRouter);
router.use(plansRouter);
router.use(statsRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(subscriptionRouter);
router.use(uploadsRouter);
router.use(heroRouter);

export default router;
