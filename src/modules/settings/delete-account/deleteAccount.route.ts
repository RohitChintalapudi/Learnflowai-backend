import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { DeleteAccountController } from "./deleteAccount.controller";

const router: Router = Router();
const deleteAccountController = new DeleteAccountController();

// Requires authentication
router.use(authMiddleware);

router.delete("/", deleteAccountController.deleteAccount);

export default router;
