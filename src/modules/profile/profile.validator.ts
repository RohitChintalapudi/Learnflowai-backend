import { z } from "zod";

export const updateProfileSchema = z.object({
	name: z.string().max(50, "Name cannot exceed 50 characters").optional(),
	bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
	learningGoals: z.string().max(500, "Learning goals cannot exceed 500 characters").optional(),
});
