import type { Request, Response } from "express";
import { AnalogyService } from "./analogy.service";
import { AnalogyRequestSchema } from "./analogy.validator";

export class AnalogyController {
	private analogyService: AnalogyService;

	constructor() {
		this.analogyService = new AnalogyService();
	}

	public async generateAnalogy(req: Request, res: Response): Promise<void> {
		try {
			const parsedBody = AnalogyRequestSchema.safeParse(req.body);

			if (!parsedBody.success) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: parsedBody.error.flatten().fieldErrors,
				});
				return;
			}

			const { documentId, highlightedText, style } = parsedBody.data;

			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized access" });
				return;
			}

			const result = await this.analogyService.generateAnalogy(
				documentId,
				highlightedText,
				style,
				user.id,
			);

			if (!result.success) {
				if (result.message === "Unauthorized document access or document not found") {
					res.status(403).json(result);
					return;
				}
				res.status(400).json(result);
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			console.error("Analogy controller error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
