import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { avatarUploadMiddleware } from "../../middlewares/avatarUpload.middleware";

const router: Router = Router();
const profileController = new ProfileController();

// All profile routes require authentication
router.use(authMiddleware);

router.get("/", profileController.getProfile);
router.patch("/", profileController.updateProfile);
router.get("/stats", profileController.getStats);

// Avatar upload routes
router.post(
  "/avatar",
  avatarUploadMiddleware.single("avatar"),
  profileController.uploadAvatar
);
router.delete("/avatar", profileController.deleteAvatar);

export default router;
