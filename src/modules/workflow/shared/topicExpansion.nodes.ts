import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getGroqClient } from "../../../lib/ai/groq";
import { TOPIC_DETECTION_AND_EXPANSION_SYSTEM_PROMPT } from "./topicExpansion.prompts";

export const topicDetectionNode = async (state: any) => {
  const { highlightedText } = state;
  // Use the ultra-fast 8b-instant model to do all extraction and expansion in one shot
  const groqClient = getGroqClient();

  try {
    const response = await groqClient.invoke([
      new SystemMessage(TOPIC_DETECTION_AND_EXPANSION_SYSTEM_PROMPT),
      new HumanMessage(`Highlighted Text:\n${highlightedText}`),
    ], {
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.content as string);
    return {
      mainTopic: parsed.mainTopic || "",
      keywords: parsed.keywords || [],
      subjectArea: parsed.subjectArea || "",
      relatedConcepts: parsed.relatedConcepts || [],
      subtopics: parsed.subtopics || [],
      prerequisites: parsed.prerequisites || [],
    };
  } catch (error) {
    console.error("Error in topicDetectionNode:", error);
    return {
      mainTopic: highlightedText.slice(0, 50),
      keywords: [],
      subjectArea: "",
      relatedConcepts: [],
      subtopics: [],
      prerequisites: [],
    };
  }
};

export const conceptExpansionNode = async (state: any) => {
  // Now a pass-through node! 
  // We merged Concept Expansion into Topic Detection to save 1.5 seconds per workflow request.
  // Returning an empty object prevents overwriting the expanded fields generated above.
  return {};
};
