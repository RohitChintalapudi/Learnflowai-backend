import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { FeedbackController } from "./feedback.controller";

const router: Router = Router();
const controller = new FeedbackController();

router.use(authMiddleware);

router.post("/", controller.createFeedback);
router.get("/", controller.getMyFeedback);

export default router;
