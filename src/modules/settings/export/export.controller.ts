import type { Request, Response } from "express";
import { ExportService } from "./export.service";

export class ExportController {
	private exportService: ExportService;

	constructor() {
		this.exportService = new ExportService();
	}

	public exportData = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const data = await this.exportService.exportUserData(user.id);
			res.status(200).json({
				success: true,
				data,
			});
		} catch (error: any) {
			console.error("Error in exportData:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	};
}
