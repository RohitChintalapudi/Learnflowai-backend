import { prisma } from "../../../database";
import { runMindMapWorkflow } from "./mindmap.graph";
import { MindMapResponse } from "./mindmap.types";

export class MindMapService {
  public async generateMindMap(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<MindMapResponse> {
    try {
      const startTime = Date.now();

      // 1. Verify document exists and check ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, uploadedBy: true, title: true },
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
      const result = await runMindMapWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

      // 3. Save generated mind map to DB
      const generatedMindMap = await prisma.generatedMindMap.create({
        data: {
          documentId,
          userId,
          highlightedText,
          title: result.mainTopic || "Mind Map",
          mindMapData: result.mindMapData || {},
        },
      });

      // 4. Analytics Event
      const analyticsEvent = {
        event: "AI_MINDMAP_GENERATED",
        userId,
        documentId,
        highlightedText,
        timestamp: new Date().toISOString(),
        workflowTimeMs: workflowTime,
        nodeCount: result.mindMapData?.nodes?.length || 0,
      };
      console.log(JSON.stringify(analyticsEvent));

      return {
        success: true,
        message: "Mind map generated successfully",
        mindMap: {
          ...result.mindMapData,
          id: generatedMindMap.id,
        },
      };
    } catch (error) {
      console.error("Error generating mind map:", error);
      return {
        success: false,
        message: "An error occurred while generating the mind map",
      };
    }
  }

  public async explainMindMap(mindMapId: string, userId: string): Promise<{ success: boolean; message: string; explanation?: string }> {
    try {
      const generatedMindMap = await prisma.generatedMindMap.findUnique({
        where: { id: mindMapId },
        select: { id: true, userId: true, title: true, mindMapData: true },
      });

      if (!generatedMindMap) {
        return { success: false, message: "Mind map not found" };
      }

      if (generatedMindMap.userId !== userId) {
        return { success: false, message: "Unauthorized access to this mind map" };
      }

      const { getGroqClient } = await import("../../../lib/ai/groq");
      const { SystemMessage, HumanMessage } = await import("@langchain/core/messages");
      
      const groqClient = getGroqClient(); // Uses fast llama-3.1-8b-instant

      const graphData = JSON.stringify(generatedMindMap.mindMapData);
      const prompt = `You are an expert tutor. Here is the structured JSON of a mind map titled "${generatedMindMap.title}".
Mind Map JSON:
${graphData}

Please explain the logical flow of this mind map in a simple, easy-to-understand conversational tone. Do not mention JSON or node IDs. Just explain the concepts and how they relate. Keep it under 3 paragraphs.`;

      const response = await groqClient.invoke([
        new SystemMessage("You explain educational concepts simply and clearly based on a structured mind map."),
        new HumanMessage(prompt)
      ]);

      return {
        success: true,
        message: "Explanation generated successfully",
        explanation: response.content as string,
      };

    } catch (error) {
      console.error("Error explaining mind map:", error);
      return { success: false, message: "Failed to generate explanation" };
    }
  }
}
