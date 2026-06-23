import type { Request, Response } from "express";
import { QuizService } from "./quiz.service";
import { QuizRequestSchema } from "./quiz.validator";

export class QuizController {
	private quizService: QuizService;

	constructor() {
		this.quizService = new QuizService();
	}

	public async generateQuiz(req: Request, res: Response): Promise<void> {
		try {
			// 1. Validate request body
			const parsedBody = QuizRequestSchema.safeParse(req.body);

			if (!parsedBody.success) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: parsedBody.error.flatten().fieldErrors,
				});
				return;
			}

			const { documentId, highlightedText } = parsedBody.data;

			// Ensure user is authenticated via middleware
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			// 2. Call service
			const result = await this.quizService.generateQuiz(documentId, highlightedText, user.id);

			// 3. Return response
			if (!result.success) {
				if (result.message === "Unauthorized document access") {
					res.status(403).json(result);
					return;
				}
				res.status(400).json(result);
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			console.error("Quiz controller error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}

	public async getQuizzes(req: Request, res: Response): Promise<void> {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const result = await this.quizService.getQuizzes(user.id);

			if (!result.success) {
				res.status(400).json(result);
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			console.error("Quiz controller error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}

	public async submitQuiz(req: Request, res: Response): Promise<void> {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const { id } = req.params;
			const { score, totalQuestions, topicsToImprove } = req.body;

			if (score === undefined || totalQuestions === undefined || !Array.isArray(topicsToImprove)) {
				res.status(400).json({ success: false, message: "Invalid request body for submission" });
				return;
			}

			const result = await this.quizService.submitQuiz(
				id as string,
				user.id,
				score,
				totalQuestions,
				topicsToImprove,
			);

			if (!result.success) {
				if (result.message === "Unauthorized access") {
					res.status(403).json(result);
					return;
				}
				res.status(400).json(result);
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			console.error("Quiz controller error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
