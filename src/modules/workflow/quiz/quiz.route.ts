import { Router } from "express";
import { QuizController } from "./quiz.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router: Router = Router();
const quizController = new QuizController();

router.post(
  "/",
  authMiddleware,
  quizController.generateQuiz.bind(quizController)
);

export default router;
