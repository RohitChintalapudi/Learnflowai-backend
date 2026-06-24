import type { Request, Response } from "express";
import { SimulationService } from "./simulation.service";

const simulationService = new SimulationService();

export class SimulationController {
	public async generateSimulation(req: Request, res: Response): Promise<void> {
		try {
			let { documentId, highlightedText, simulationType, difficulty } = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			// Sanitize and validate inputs
			if (typeof documentId === "string") documentId = documentId.trim();
			if (typeof highlightedText === "string") {
				highlightedText = highlightedText.trim();
				// Truncate to 3000 chars to avoid model limits
				if (highlightedText.length > 3000) {
					highlightedText = highlightedText.substring(0, 3000);
				}
			}
			if (typeof simulationType === "string") simulationType = simulationType.trim().toLowerCase();
			if (typeof difficulty === "string") difficulty = difficulty.trim().toLowerCase();

			if (!documentId || !highlightedText || !simulationType || !difficulty) {
				res.status(400).json({
					success: false,
					message: "documentId, highlightedText, simulationType, and difficulty are required",
				});
				return;
			}

			const validTypes = ["visual-flow", "step-by-step", "real-world"];
			if (!validTypes.includes(simulationType)) {
				res.status(400).json({
					success: false,
					message: "simulationType must be one of: visual-flow, step-by-step, real-world",
				});
				return;
			}

			const validDifficulties = ["beginner", "intermediate", "advanced"];
			if (!validDifficulties.includes(difficulty)) {
				res.status(400).json({
					success: false,
					message: "difficulty must be one of: beginner, intermediate, advanced",
				});
				return;
			}

			const result = await simulationService.generateSimulation(
				documentId,
				highlightedText,
				simulationType,
				difficulty,
				userId,
			);

			if (!result.success) {
				res.status(400).json(result);
				return;
			}

			res.status(200).json(result);
		} catch (error) {
			console.error("[SimulationController] Error generating simulation:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error while generating simulation",
			});
		}
	}
}
