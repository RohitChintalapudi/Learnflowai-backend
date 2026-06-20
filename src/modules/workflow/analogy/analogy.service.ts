import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";
import { runAnalogyWorkflow } from "./analogy.graph";
import { AnalogyResponse } from "./analogy.types";
import { prisma } from "../../../database/prisma";

export class AnalogyService {
  public async generateAnalogy(
    documentId: string,
    highlightedText: string,
    style: string,
    userId: string
  ): Promise<AnalogyResponse> {
    try {
      // 1. Verify document access
      const document = await prisma.document.findFirst({
        where: { id: documentId, uploadedBy: userId },
      });

      if (!document) {
        return {
          success: false,
          message: "Unauthorized document access or document not found",
        };
      }

      // 2. Run LangGraph workflow
      const workflowState = await runAnalogyWorkflow(
        documentId,
        highlightedText,
        style,
        userId
      );

      if (!workflowState.analogyData) {
        return {
          success: false,
          message: "Failed to generate valid analogy data",
        };
      }

      // 3. Store in database
      const generatedAnalogy = await prisma.generatedAnalogy.create({
        data: {
          userId,
          documentId,
          highlightedText,
          style,
          title: workflowState.analogyData.title,
          analogyData: workflowState.analogyData,
        },
      });

      // 4. Analytics
      await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_ANALOGY_GENERATED, { documentId });
      
      if (workflowState?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          workflowState.mainTopic, 
          ...(workflowState.relatedConcepts || [])
        ]);
      }

      return {
        success: true,
        analogy: {
          id: generatedAnalogy.id,
          ...workflowState.analogyData
        },
      };
    } catch (error) {
      console.error("Error in AnalogyService:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate analogy",
      };
    }
  }
}
