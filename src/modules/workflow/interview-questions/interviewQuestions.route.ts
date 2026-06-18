import { Router } from "express";
import { InterviewQuestionsController } from "./interviewQuestions.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router: Router = Router();
const interviewQuestionsController = new InterviewQuestionsController();

router.post(
  "/",
  authMiddleware,
  interviewQuestionsController.generateQuestions.bind(interviewQuestionsController)
);

export default router;
