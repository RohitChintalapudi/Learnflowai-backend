import { z } from "zod";

export const explanationRequestSchema = z.object({
	documentId: z.string({
		message: "documentId is required",
	}),
	highlightedText: z
		.string({
			message: "highlightedText is required",
		})
		.min(5, "highlightedText must be at least 5 characters long")
		.max(5000, "highlightedText must be at most 5000 characters long"),
});
