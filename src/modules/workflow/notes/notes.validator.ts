import { z } from "zod";

export const notesRequestSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  highlightedText: z
    .string()
    .min(5, "Highlighted text must be at least 5 characters")
    .max(5000, "Highlighted text must be at most 5000 characters"),
});
