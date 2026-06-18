import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { Langfuse } from "langfuse";
import { getGroqClient } from "../../../lib/ai/groq";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import {
  INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
  INTERVIEW_QUESTIONS_USER_PROMPT,
} from "./interviewQuestions.prompts";
import { parseInterviewQuestionsResponse } from "./interviewQuestions.types";
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
  questions: Annotation<any>(),
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
    context += "Chunk " + (index + 1) + ":\n" + chunk.content + "\n\n";
  });

  return { context };
};

const generateQuestionsNode = async (state: typeof GraphState.State) => {
  const { highlightedText, context, traceId } = state;

  const trace = langfuse.trace({ id: traceId });
  
  const userPrompt = INTERVIEW_QUESTIONS_USER_PROMPT
    .replace("{highlightedText}", highlightedText)
    .replace("{context}", context);

  const generation = trace.generation({
    name: "generate-interview-questions",
    model: "llama-3.3-70b-versatile",
    modelParameters: {
      temperature: 0.4,
      maxTokens: 2000,
      responseFormat: "json_object",
    },
    input: [
      { role: "system", content: INTERVIEW_QUESTIONS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  });

  const groqClient = getGroqClient();

  let parsedQuestions: {
    basic: { q: string; a: string }[];
    intermediate: { q: string; a: string }[];
    advanced: { q: string; a: string }[];
  } = { basic: [], intermediate: [], advanced: [] };

  // Attempt JSON generation and parsing up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await groqClient.invoke([
        new SystemMessage(INTERVIEW_QUESTIONS_SYSTEM_PROMPT),
        new HumanMessage(userPrompt),
      ], {
        response_format: { type: "json_object" }
      });

      const rawResponse = response.content as string;
      parsedQuestions = parseInterviewQuestionsResponse(rawResponse);
      break; // Success
    } catch (error) {
      if (attempt === 2) {
        generation.end({ level: "ERROR", statusMessage: (error as Error).message });
        throw new Error("Failed to generate valid JSON questions after 2 attempts. Last error: " + (error as Error).message);
      }
    }
  }

  generation.end({
    output: parsedQuestions,
  });

  return { questions: parsedQuestions };
};

const workflow = new StateGraph(GraphState)
  .addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
  .addNode("BuildContext", buildContextNode)
  .addNode("GenerateQuestions", generateQuestionsNode)
  .addEdge(START, "RetrieveRelevantChunks")
  .addEdge("RetrieveRelevantChunks", "BuildContext")
  .addEdge("BuildContext", "GenerateQuestions")
  .addEdge("GenerateQuestions", END);

export const interviewQuestionsApp = workflow.compile();

export const runInterviewQuestionsWorkflow = async (documentId: string, highlightedText: string, userId: string) => {
  const trace = langfuse.trace({
    name: "interview-questions-workflow",
    userId,
    tags: ["interview-questions"],
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
    questions: { basic: [], intermediate: [], advanced: [] },
    traceId: trace.id,
  };

  const result = await interviewQuestionsApp.invoke(initialState);
  
  // Wait for langfuse events to flush
  await langfuse.flushAsync();

  return result;
};
