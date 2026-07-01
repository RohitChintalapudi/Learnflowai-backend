import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { AlertsController } from "./alerts.controller";

const router: Router = Router();
const controller = new AlertsController();

// Require authentication for all alerts routes
router.use(authMiddleware);

router.get("/", controller.getAlerts);
router.post("/mark-all-read", controller.markAllAsRead);
router.delete("/:id", controller.deleteAlert);
router.post("/seed", controller.seedTestAlerts);

export default router;
