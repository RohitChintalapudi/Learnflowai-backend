import { z } from "zod";

export const MindMapRequestSchema = z.object({
	documentId: z.string().min(1, "Document ID is required"),
	highlightedText: z
		.string()
		.min(5, "Highlighted text must be at least 5 characters")
		.max(5000, "Highlighted text cannot exceed 5000 characters"),
});

export const MindMapExplainRequestSchema = z.object({
	mindMapId: z.string().min(1, "Mind Map ID is required"),
});
