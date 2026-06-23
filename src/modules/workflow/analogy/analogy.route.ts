import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { AnalogyController } from "./analogy.controller";

const router: Router = Router();
const analogyController = new AnalogyController();

router.post("/", authMiddleware, analogyController.generateAnalogy.bind(analogyController));

export default router;
