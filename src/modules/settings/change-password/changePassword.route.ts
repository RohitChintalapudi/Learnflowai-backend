import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { ChangePasswordController } from "./changePassword.controller";

const router: Router = Router();
const changePasswordController = new ChangePasswordController();

// Requires authentication
router.use(authMiddleware);

router.patch("/", changePasswordController.changePassword);

export default router;