import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { AccountSettingsController } from "./account.controller";

const router: Router = Router();
const controller = new AccountSettingsController();

// Require authentication for all account settings routes
router.use(authMiddleware);

router.get("/", controller.getAccountDetails);

export default router;
