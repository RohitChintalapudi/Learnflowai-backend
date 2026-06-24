import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { InterviewQuestionsController } from "./interviewQuestions.controller";

const router: Router = Router();
const interviewQuestionsController = new InterviewQuestionsController();

router.post(
	"/",
	authMiddleware,
	interviewQuestionsController.generateQuestions.bind(interviewQuestionsController),
);

export default router;
