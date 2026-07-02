import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { StorageSettingsController } from "./storage.controller";

const router: Router = Router();
const controller = new StorageSettingsController();

// Require authentication for all storage settings routes
router.use(authMiddleware);

router.get("/", controller.getStorageDetails);
router.post("/delete-cache", controller.deleteCache);

export default router;
