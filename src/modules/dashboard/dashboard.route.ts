import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { DashboardController } from "./dashboard.controller";

const router: Router = Router();
const dashboardController = new DashboardController();

// Apply auth middleware
router.use(authMiddleware);

router.get("/summary", dashboardController.getSummary.bind(dashboardController));

export default router;
