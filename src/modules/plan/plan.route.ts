import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { PlanController } from "./plan.controller";

const router: Router = Router();
const controller = new PlanController();

// Require authentication for all plan routes
router.use(authMiddleware);

router.get("/", controller.getPlan);
router.post("/upgrade", controller.upgradePlan);

export default router;
