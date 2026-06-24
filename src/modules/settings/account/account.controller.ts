import type { Request, Response } from "express";
import { AccountSettingsService } from "./account.service";

export class AccountSettingsController {
	private accountSettingsService: AccountSettingsService;

	constructor() {
		this.accountSettingsService = new AccountSettingsService();
	}

	public getAccountDetails = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const accountSettings = await this.accountSettingsService.getAccountDetails(user.id);
			res.status(200).json({ success: true, data: accountSettings });
		} catch (error) {
			console.error("Error in getAccountDetails:", error);
			const message = error instanceof Error ? error.message : "Internal server error";
			const status = message === "User not found" ? 404 : 500;
			res.status(status).json({ success: false, message });
		}
	};
}
