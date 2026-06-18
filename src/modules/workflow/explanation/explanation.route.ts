import { Router } from "express";
import { ExplanationController } from "./explanation.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router: Router = Router();
const explanationController = new ExplanationController();

router.post(
  "/",
  authMiddleware,
  explanationController.generateExplanation.bind(explanationController)
);

export default router;
