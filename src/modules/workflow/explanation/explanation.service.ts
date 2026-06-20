import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";
import { prisma } from "../../../database";
import { runExplanationWorkflow } from "./explanation.graph";
import { ExplanationResponse } from "./explanation.types";

export class ExplanationService {
  public async generateExplanation(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<ExplanationResponse> {
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
      const result = await runExplanationWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

      // 3. Save explanation to DB
      await prisma.explanation.create({
        data: {
          userId,
          documentId,
          highlightedText,
          explanationText: result.explanation,
        }
      });

      // 4. Analytics Event
      await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_EXPLANATION_GENERATED, { documentId });
      
      if (result?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          result.mainTopic, 
          ...(result.relatedConcepts || [])
        ]);
      }

      return {
        success: true,
        explanation: result.explanation,
        retrievedChunks: result.retrievedChunks.length,
      };
    } catch (error) {
      console.error("Error generating explanation:", error);
      return {
        success: false,
        message: "An error occurred while generating the explanation",
      };
    }
  }
}
