import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { ExplanationController } from "./explanation.controller";

const router: Router = Router();
const explanationController = new ExplanationController();

router.post(
	"/",
	authMiddleware,
	explanationController.generateExplanation.bind(explanationController),
);

export default router;
