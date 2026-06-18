import { prisma } from "../../../database";
import { runQuizWorkflow } from "./quiz.graph";
import { QuizResponse } from "./quiz.types";

export class QuizService {
  public async generateQuiz(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<QuizResponse> {
    try {
      const startTime = Date.now();

      // 1. Verify document exists and check ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, uploadedBy: true },
      });

      if (!document) {
        return { success: false, message: "Document not found" };
      }

      // If document was uploaded anonymously (uploadedBy is null), allow access.
      // Otherwise, ensure the authenticated user owns it.
      if (document.uploadedBy && document.uploadedBy !== userId) {
        return { success: false, message: "Unauthorized document access" };
      }

      // 2. Run LangGraph workflow
      const result = await runQuizWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

      // 3. Save generated quiz to DB
      await prisma.quizSet.create({
        data: {
          userId,
          documentId,
          highlightedText,
          quizJson: result.quiz,
        }
      });

      // 4. Analytics Event
      const analyticsEvent = {
        event: "AI_QUIZ_GENERATED",
        userId,
        documentId,
        highlightedText,
        timestamp: new Date().toISOString(),
        workflowTimeMs: workflowTime,
        retrievedChunks: result.retrievedChunks.length,
      };
      console.log(JSON.stringify(analyticsEvent));

      return {
        success: true,
        quiz: result.quiz,
        retrievedChunks: result.retrievedChunks.length,
      };
    } catch (error) {
      console.error("Error generating quiz:", error);
      return {
        success: false,
        message: "An error occurred while generating the quiz",
      };
    }
  }
}
