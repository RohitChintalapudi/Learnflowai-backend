import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/app-error";
import { DeleteAccountService } from "./deleteAccount.service";
import { deleteAccountSchema } from "./deleteAccount.validator";

export class DeleteAccountController {
	private deleteAccountService: DeleteAccountService;

	constructor() {
		this.deleteAccountService = new DeleteAccountService();
	}

	public deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new AppError("Unauthorized", 401);
			}

			// Validate the confirmation text
			const parsed = deleteAccountSchema.safeParse(req.body);
			if (!parsed.success) {
				const errorMessage = parsed.error.issues[0]?.message || "Invalid input";
				throw new AppError(errorMessage, 400);
			}

			await this.deleteAccountService.deleteUserAccount(userId);

			res.status(200).json({
				success: true,
				message: "Account deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}
