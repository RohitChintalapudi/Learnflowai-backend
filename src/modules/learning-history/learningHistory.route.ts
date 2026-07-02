import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { getHistory, getSuggestions } from "./learningHistory.controller";

const router: Router = Router();

router.use(authMiddleware as any);

router.get("/", getHistory);
router.get("/suggestions", getSuggestions);

export default router;
