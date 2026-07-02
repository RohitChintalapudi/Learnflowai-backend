import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { ExportController } from "./export.controller";

const router: Router = Router();
const exportController = new ExportController();

// Require authentication for all settings export endpoints
router.use(authMiddleware);

router.get("/", exportController.exportData);

export default router;
