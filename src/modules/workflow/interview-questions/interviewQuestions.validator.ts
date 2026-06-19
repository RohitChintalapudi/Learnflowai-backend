import { z } from "zod";

export const InterviewQuestionsRequestSchema = z.object({
  documentId: z.string().min(1, "documentId is required"),
  highlightedText: z.string()
    .min(5, "Highlighted text must be at least 5 characters long")
    .max(5000, "Highlighted text cannot exceed 5000 characters"),
});

export type InterviewQuestionsRequestDTO = z.infer<typeof InterviewQuestionsRequestSchema>;
