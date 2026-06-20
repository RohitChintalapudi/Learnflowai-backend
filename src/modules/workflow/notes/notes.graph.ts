import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { Langfuse } from "langfuse";
import { getGroqClient } from "../../../lib/ai/groq";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { NOTES_SYSTEM_PROMPT, NOTES_USER_PROMPT_TEMPLATE } from "./notes.prompts";
import { env } from "../../../config/env";
import { parseNotesResponse } from "./notes.parser";
import { GeneratedNotes } from "./notes.types";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import { topicDetectionNode, conceptExpansionNode } from "../shared/topicExpansion.nodes";

const langfuse = new Langfuse({
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

const GraphState = Annotation.Root({
  ...TopicExpansionState,
  documentId: Annotation<string>(),
  highlightedText: Annotation<string>(),
  retrievedChunks: Annotation<any[]>(),
  context: Annotation<string>(),
  notes: Annotation<GeneratedNotes | null>(),
  traceId: Annotation<string>(),
});

const retrieveRelevantChunksNode = async (state: typeof GraphState.State) => {
  const { highlightedText, documentId, traceId, mainTopic, relatedConcepts, subtopics } = state;

  const trace = langfuse.trace({ id: traceId });
  const span = trace.span({
    name: "retrieve-chunks",
    input: { highlightedText, mainTopic, relatedConcepts, subtopics, documentId },
  });

  const startTime = Date.now();
  
  // 1. Generate embedding for expanded query
  const query = `${highlightedText} ${mainTopic || ""} ${(relatedConcepts || []).join(" ")} ${(subtopics || []).join(" ")}`;
  const embedding = await generateEmbedding(query);
  
  // 2. Fetch and sort top chunks
  const chunks = await retrieveRelevantChunks(documentId, embedding, 5);

  const duration = Date.now() - startTime;
  span.end({
    output: { chunkCount: chunks.length, retrievedChunks: chunks },
  });

  return {
    retrievedChunks: chunks,
  };
};

const buildContextNode = async (state: typeof GraphState.State) => {
  const { retrievedChunks, mainTopic, relatedConcepts, subtopics, prerequisites } = state;
  let context = "";

  if (mainTopic) {
    context += `Main Topic:\n${mainTopic}\n\n`;
  }
  if (relatedConcepts && relatedConcepts.length > 0) {
    context += `Related Concepts:\n${relatedConcepts.map((c: string) => "- " + c).join("\n")}\n\n`;
  }
  if (subtopics && subtopics.length > 0) {
    context += `Subtopics:\n${subtopics.map((s: string) => "- " + s).join("\n")}\n\n`;
  }
  if (prerequisites && prerequisites.length > 0) {
    context += `Prerequisites:\n${prerequisites.map((p: string) => "- " + p).join("\n")}\n\n`;
  }

  context += "Document Context:\n";

  retrievedChunks.forEach((chunk, index) => {
    context += "Chunk " + (index + 1) + ":\\n" + chunk.content + "\\n\\n";
  });

  return { context };
};

const generateNotesNode = async (state: typeof GraphState.State) => {
  const { highlightedText, context, traceId } = state;

  const trace = langfuse.trace({ id: traceId });
  
  const userPrompt = NOTES_USER_PROMPT_TEMPLATE
    .replace("{highlightedText}", highlightedText)
    .replace("{context}", context);

  const generation = trace.generation({
    name: "generate-notes",
    model: "llama-3.3-70b-versatile",
    modelParameters: {
      temperature: 0.3,
      maxTokens: 2500,
    },
    input: [
      { role: "system", content: NOTES_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  });

  const groqClient = getGroqClient();

  let notes: GeneratedNotes | null = null;
  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    try {
      const response = await groqClient.invoke([
        new SystemMessage(NOTES_SYSTEM_PROMPT),
        new HumanMessage(userPrompt),
      ], {
        response_format: { type: "json_object" }
      });

      const jsonResponse = response.content as string;
      notes = parseNotesResponse(jsonResponse);
      
      if (notes) {
        break; // Successfully parsed
      }
      
      retryCount++;
    } catch (error) {
      console.error("Error generating notes:", error);
      retryCount++;
    }
  }

  generation.end({
    output: notes || "Failed to generate valid notes",
  });

  if (!notes) {
    throw new Error("Failed to parse notes response from LLM after retries");
  }

  return { notes };
};

const workflow = new StateGraph(GraphState)
  .addNode("TopicDetection", topicDetectionNode)
  .addNode("ConceptExpansion", conceptExpansionNode)
  .addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
  .addNode("BuildContext", buildContextNode)
  .addNode("GenerateNotes", generateNotesNode)
  .addEdge(START, "TopicDetection")
  .addEdge("TopicDetection", "ConceptExpansion")
  .addEdge("ConceptExpansion", "RetrieveRelevantChunks")
  .addEdge("RetrieveRelevantChunks", "BuildContext")
  .addEdge("BuildContext", "GenerateNotes")
  .addEdge("GenerateNotes", END);

export const notesApp = workflow.compile();

export const runNotesWorkflow = async (documentId: string, highlightedText: string, userId: string) => {
  const trace = langfuse.trace({
    name: "notes-workflow",
    userId,
    tags: ["notes"],
    metadata: {
      documentId,
      highlightedText
    }
  });

  const initialState = {
    documentId,
    highlightedText,
    mainTopic: "",
    keywords: [],
    subjectArea: "",
    relatedConcepts: [],
    subtopics: [],
    prerequisites: [],
    retrievedChunks: [],
    context: "",
    notes: null,
    traceId: trace.id,
  };

  const result = await notesApp.invoke(initialState);
  
  // Wait for langfuse events to flush
  await langfuse.flushAsync();

  return result;
};
