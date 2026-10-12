import type { Request, Response } from "express";
import { prisma } from "../../database";

export class FeedbackController {
	async createFeedback(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const { rating, comment } = req.body;

			if (typeof rating !== "number" || rating < 1 || rating > 5) {
				res.status(400).json({
					success: false,
					message: "Rating must be an integer between 1 and 5",
				});
				return;
			}

			const feedback = await prisma.feedback.create({
				data: {
					userId,
					rating: Math.round(rating),
					comment: typeof comment === "string" ? comment.trim() : null,
				},
			});

			res.status(201).json({
				success: true,
				message: "Feedback submitted successfully",
				data: feedback,
			});
		} catch (error) {
			console.error("Failed to submit feedback:", error);
			res.status(500).json({
				success: false,
				message: "Failed to submit feedback",
			});
		}
	}

	async getMyFeedback(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const feedbacks = await prisma.feedback.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 20,
			});

			res.json({
				success: true,
				data: feedbacks,
			});
		} catch (error) {
			console.error("Failed to get feedback:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get feedback",
			});
		}
	}
}
