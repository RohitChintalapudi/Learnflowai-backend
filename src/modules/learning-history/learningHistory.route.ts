import { Router } from "express";
import { getHistory, getSuggestions } from "./learningHistory.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router: Router = Router();

router.use(authMiddleware as any);

router.get("/", getHistory);
router.get("/suggestions", getSuggestions);

export default router;
