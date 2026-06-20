import { Router } from "express";
import { AnalogyController } from "./analogy.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router: Router = Router();
const analogyController = new AnalogyController();

router.post(
  "/",
  authMiddleware,
  analogyController.generateAnalogy.bind(analogyController)
);

export default router;
