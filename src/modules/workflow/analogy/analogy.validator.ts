import { z } from "zod";

export const analogyStyles = [
	"gaming",
	"story",
	"education",
	"real-world",
	"sports",
	"movie",
	"eli10",
] as const;

export const AnalogyRequestSchema = z.object({
	documentId: z.string().min(1, "Document ID is required"),
	highlightedText: z
		.string()
		.min(5, "Highlighted text must be at least 5 characters")
		.max(5000, "Highlighted text cannot exceed 5000 characters"),
	style: z.enum(analogyStyles, {
		message: "Invalid style selected",
	}),
});
