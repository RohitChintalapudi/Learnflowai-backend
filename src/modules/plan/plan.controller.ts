import type { Request, Response } from "express";
import { PlanService, type PlanInterval } from "./plan.service";

export class PlanController {
	private planService: PlanService;

	constructor() {
		this.planService = new PlanService();
	}

	public getPlan = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const plan = await this.planService.getPlan(user.id);
			res.status(200).json({ success: true, data: plan });
		} catch (error) {
			console.error("Error in getPlan:", error);
			const message = error instanceof Error ? error.message : "Internal server error";
			const status = message === "User not found" ? 404 : 500;
			res.status(status).json({ success: false, message });
		}
	};

	public upgradePlan = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const interval = req.body?.interval as PlanInterval;
			const plan = await this.planService.upgradeToPro(user.id, interval);
			res.status(200).json({ success: true, data: plan });
		} catch (error) {
			console.error("Error in upgradePlan:", error);
			const message = error instanceof Error ? error.message : "Internal server error";
			const status =
				message === "Invalid plan interval"
					? 400
					: message === "User not found"
						? 404
						: 500;
			res.status(status).json({ success: false, message });
		}
	};
}
