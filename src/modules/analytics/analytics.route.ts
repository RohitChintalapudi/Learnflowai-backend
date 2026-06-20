import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router: Router = Router();

router.use(authMiddleware);

router.get("/overview", AnalyticsController.getOverview);
router.get("/activity", AnalyticsController.getActivity);
router.get("/feature-usage", AnalyticsController.getFeatureUsage);
router.get("/topics", AnalyticsController.getTopics);
router.get("/consistency", AnalyticsController.getConsistency);
router.get("/productivity", AnalyticsController.getProductivity);
router.get("/revisions", AnalyticsController.getRevisions);
router.get("/insights", AnalyticsController.getInsights);

export default router;
