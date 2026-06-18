import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { Langfuse } from "langfuse";
import { getGroqClient } from "../../../lib/ai/groq";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import {
  EXPLANATION_SYSTEM_PROMPT,
  EXPLANATION_USER_PROMPT_TEMPLATE,
} from "./explanation.prompts";
import { env } from "../../../config/env";

const langfuse = new Langfuse({
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

const GraphState = Annotation.Root({
  documentId: Annotation<string>(),
  highlightedText: Annotation<string>(),
  retrievedChunks: Annotation<any[]>(),
  context: Annotation<string>(),
  explanation: Annotation<string>(),
  traceId: Annotation<string>(),
});

const retrieveRelevantChunksNode = async (state: typeof GraphState.State) => {
  const { highlightedText, documentId, traceId } = state;

  const trace = langfuse.trace({ id: traceId });
  const span = trace.span({
    name: "retrieve-chunks",
    input: { highlightedText, documentId },
  });

  const startTime = Date.now();
  
  // 1. Generate embedding for highlighted text
  const embedding = await generateEmbedding(highlightedText);
  
  // 2-5. Fetch and sort top chunks
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
  const { retrievedChunks } = state;
  let context = "";

  // Target: 4-5 chunks max 3000 tokens (approx)
  // We already limit chunks to 5 in retrieveRelevantChunksNode
  retrievedChunks.forEach((chunk, index) => {
    context += `Chunk ${index + 1}:\n${chunk.content}\n\n`;
  });

  return { context };
};

const generateExplanationNode = async (state: typeof GraphState.State) => {
  const { highlightedText, context, traceId } = state;

  const trace = langfuse.trace({ id: traceId });
  
  const userPrompt = EXPLANATION_USER_PROMPT_TEMPLATE
    .replace("{highlightedText}", highlightedText)
    .replace("{context}", context);

  const generation = trace.generation({
    name: "generate-explanation",
    model: "llama-3.3-70b-versatile",
    modelParameters: {
      temperature: 0.3,
      maxTokens: 1500,
    },
    input: [
      { role: "system", content: EXPLANATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  });

  const groqClient = getGroqClient();

  const response = await groqClient.invoke([
    new SystemMessage(EXPLANATION_SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ]);

  const explanation = response.content as string;

  generation.end({
    output: explanation,
  });

  return { explanation };
};

const workflow = new StateGraph(GraphState)
  .addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
  .addNode("BuildContext", buildContextNode)
  .addNode("GenerateExplanation", generateExplanationNode)
  .addEdge(START, "RetrieveRelevantChunks")
  .addEdge("RetrieveRelevantChunks", "BuildContext")
  .addEdge("BuildContext", "GenerateExplanation")
  .addEdge("GenerateExplanation", END);

export const explanationApp = workflow.compile();

export const runExplanationWorkflow = async (documentId: string, highlightedText: string, userId: string) => {
  const trace = langfuse.trace({
    name: "explanation-workflow",
    userId,
    tags: ["explanation"],
    metadata: {
      documentId,
      highlightedText
    }
  });

  const initialState = {
    documentId,
    highlightedText,
    retrievedChunks: [],
    context: "",
    explanation: "",
    traceId: trace.id,
  };

  const result = await explanationApp.invoke(initialState);
  
  // Wait for langfuse events to flush
  await langfuse.flushAsync();

  return result;
};
