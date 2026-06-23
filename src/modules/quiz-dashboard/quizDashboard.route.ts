import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { QuizDashboardController } from "./quizDashboard.controller";

const router: Router = Router();
const quizDashboardController = new QuizDashboardController();

// All routes require authentication
router.use(authMiddleware);

router.get("/", quizDashboardController.getAllQuizzes.bind(quizDashboardController));
router.get("/recent", quizDashboardController.getRecentQuizzes.bind(quizDashboardController));
router.get("/stats", quizDashboardController.getQuizStats.bind(quizDashboardController));
router.get("/:quizId", quizDashboardController.getSingleQuiz.bind(quizDashboardController));
router.delete("/:quizId", quizDashboardController.deleteQuiz.bind(quizDashboardController));

export default router;
