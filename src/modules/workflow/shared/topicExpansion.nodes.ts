import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getGroqClient } from "../../../lib/ai/groq";
import { TOPIC_DETECTION_SYSTEM_PROMPT, CONCEPT_EXPANSION_SYSTEM_PROMPT, CONCEPT_EXPANSION_USER_PROMPT } from "./topicExpansion.prompts";

export const topicDetectionNode = async (state: any) => {
  const { highlightedText } = state;
  const groqClient = getGroqClient();

  try {
    const response = await groqClient.invoke([
      new SystemMessage(TOPIC_DETECTION_SYSTEM_PROMPT),
      new HumanMessage(`Highlighted Text:\n${highlightedText}`),
    ], {
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.content as string);
    return {
      mainTopic: parsed.mainTopic || "",
      keywords: parsed.keywords || [],
      subjectArea: parsed.subjectArea || "",
    };
  } catch (error) {
    console.error("Error in topicDetectionNode:", error);
    return {
      mainTopic: highlightedText.slice(0, 50),
      keywords: [],
      subjectArea: "",
    };
  }
};

export const conceptExpansionNode = async (state: any) => {
  const { mainTopic } = state;
  const groqClient = getGroqClient();

  try {
    const userPrompt = CONCEPT_EXPANSION_USER_PROMPT.replace("{mainTopic}", mainTopic);
    
    const response = await groqClient.invoke([
      new SystemMessage(CONCEPT_EXPANSION_SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ], {
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.content as string);
    return {
      relatedConcepts: parsed.relatedConcepts || [],
      subtopics: parsed.subtopics || [],
      prerequisites: parsed.prerequisites || [],
    };
  } catch (error) {
    console.error("Error in conceptExpansionNode:", error);
    return {
      relatedConcepts: [],
      subtopics: [],
      prerequisites: [],
    };
  }
};
