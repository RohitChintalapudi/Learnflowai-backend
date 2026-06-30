import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/app-error";
import { ChangePasswordService } from "./changePassword.service";
import { changePasswordSchema } from "./changePassword.validator";

export class ChangePasswordController {
	private changePasswordService: ChangePasswordService;

	constructor() {
		this.changePasswordService = new ChangePasswordService();
	}

	public changePassword = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new AppError("Unauthorized.", 401);
			}

			const parsed = changePasswordSchema.safeParse(req.body);
			if (!parsed.success) {
				const firstIssue = parsed.error.issues[0];

				res.status(400).json({
					success: false,
					message: firstIssue?.message || "Validation error.",
					errors: parsed.error.issues.map((issue) => ({
						path: issue.path.join("."),
						message: issue.message,
					})),
				});
				return;
			}

			const { currentPassword, newPassword } = parsed.data;

			await this.changePasswordService.changePassword(userId, currentPassword, newPassword);

			res.status(200).json({
				success: true,
				message: "Password updated successfully.",
			});
		} catch (error) {
			next(error);
		}
	};
}
