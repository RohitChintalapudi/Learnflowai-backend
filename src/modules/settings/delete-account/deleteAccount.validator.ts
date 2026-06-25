import { z } from "zod";

export const deleteAccountSchema = z.object({
	confirmationText: z.string().refine((val) => val === "DELETE", {
		message: "You must type 'DELETE' to confirm account deletion",
	}),
});
