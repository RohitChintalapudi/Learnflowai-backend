import type { Request, Response } from "express";
import { InterviewQuestionsService } from "./interviewQuestions.service";
import { InterviewQuestionsRequestSchema } from "./interviewQuestions.validator";

export class InterviewQuestionsController {
	private interviewQuestionsService: InterviewQuestionsService;

	constructor() {
		this.interviewQuestionsService = new InterviewQuestionsService();
	}

	public async generateQuestions(req: Request, res: Response): Promise<void> {
		try {
			// 1. Validate request body
			const parsedBody = InterviewQuestionsRequestSchema.safeParse(req.body);

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
			const result = await this.interviewQuestionsService.generateQuestions(
				documentId,
				highlightedText,
				user.id,
			);

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
			console.error("Interview questions controller error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
