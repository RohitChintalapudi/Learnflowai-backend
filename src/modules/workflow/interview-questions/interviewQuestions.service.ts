import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";
import { prisma } from "../../../database";
import { runInterviewQuestionsWorkflow } from "./interviewQuestions.graph";
import { InterviewQuestionsResponse } from "./interviewQuestions.types";

export class InterviewQuestionsService {
  public async generateQuestions(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<InterviewQuestionsResponse> {
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
      const result = await runInterviewQuestionsWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

      // 3. Save generated questions to DB
      await prisma.interviewQuestionSet.create({
        data: {
          userId,
          documentId,
          highlightedText,
          questionsJson: result.questions,
        }
      });

      // 4. Analytics Event
      await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED, { documentId });
      
      if (result?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          result.mainTopic, 
          ...(result.relatedConcepts || [])
        ]);
      }

      return {
        success: true,
        questions: result.questions,
        retrievedChunks: result.retrievedChunks.length,
      };
    } catch (error) {
      console.error("Error generating interview questions:", error);
      return {
        success: false,
        message: "An error occurred while generating interview questions",
      };
    }
  }
}
