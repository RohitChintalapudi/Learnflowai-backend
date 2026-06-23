import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { QuizController } from "./quiz.controller";

const router: Router = Router();
const quizController = new QuizController();

router.post("/", authMiddleware, quizController.generateQuiz.bind(quizController));

router.get("/", authMiddleware, quizController.getQuizzes.bind(quizController));

router.patch("/:id/submit", authMiddleware, quizController.submitQuiz.bind(quizController));

export default router;
