import { z } from "zod";

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().trim().min(1, "Current password is required."),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters long.")
			.max(64, "New password cannot exceed 64 characters.")
			.regex(/[A-Z]/, "New password must contain at least one uppercase letter.")
			.regex(/[a-z]/, "New password must contain at least one lowercase letter.")
			.regex(/[0-9]/, "New password must contain at least one number."),
		confirmPassword: z.string().min(1, "Confirm password is required."),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});
