import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Langfuse } from "langfuse";
import { env } from "../../../config/env";
import { getGroqClient } from "../../../lib/ai/groq";
import type { RetrievedChunk } from "../../../lib/rag/retrieveRelevantChunks";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import { parseNotesResponse } from "./notes.parser";
import { NOTES_SYSTEM_PROMPT, NOTES_USER_PROMPT_TEMPLATE } from "./notes.prompts";
import type { GeneratedNotes } from "./notes.types";

const langfuse = new Langfuse({
	publicKey: env.LANGFUSE_PUBLIC_KEY,
	secretKey: env.LANGFUSE_SECRET_KEY,
	baseUrl: env.LANGFUSE_BASE_URL,
});

const GraphState = Annotation.Root({
	...TopicExpansionState,
	documentId: Annotation<string>(),
	highlightedText: Annotation<string>(),
	retrievedChunks: Annotation<RetrievedChunk[]>(),
	context: Annotation<string>(),
	notes: Annotation<GeneratedNotes | null>(),
	traceId: Annotation<string>(),
});

const retrieveRelevantChunksAndBuildContextNode = async (state: typeof GraphState.State) => {
	const { highlightedText, documentId, traceId } = state;

	const trace = langfuse.trace({ id: traceId });
	const span = trace.span({
		name: "retrieve-chunks-and-build-context",
		input: { highlightedText, documentId },
	});

	// Fetch and sort top chunks using full-text search with fallbacks
	const chunks = await retrieveRelevantChunks(documentId, highlightedText, 5);

	// Build context string
	let context = "Document Context:\n";
	chunks.forEach((chunk, index) => {
		context += `Chunk ${index + 1}:\n${chunk.content}\n\n`;
	});

	span.end({
		output: { chunkCount: chunks.length, retrievedChunks: chunks, contextLength: context.length },
	});

	return {
		retrievedChunks: chunks,
		context,
	};
};

const generateNotesNode = async (state: typeof GraphState.State) => {
	const { highlightedText, context, traceId } = state;

	const trace = langfuse.trace({ id: traceId });

	const userPrompt = NOTES_USER_PROMPT_TEMPLATE.replace(
		"{highlightedText}",
		highlightedText,
	).replace("{context}", context);

	const generation = trace.generation({
		name: "generate-notes",
		model: "llama-3.1-8b-instant",
		modelParameters: {
			temperature: 0.3,
			maxTokens: 2500,
		},
		input: [
			{ role: "system", content: NOTES_SYSTEM_PROMPT },
			{ role: "user", content: userPrompt },
		],
	});

	const groqClient = getGroqClient("llama-3.1-8b-instant");

	let notes: GeneratedNotes | null = null;
	let retryCount = 0;
	const maxRetries = 1;

	while (retryCount <= maxRetries) {
		try {
			const response = await groqClient.invoke(
				[new SystemMessage(NOTES_SYSTEM_PROMPT), new HumanMessage(userPrompt)],
				{
					response_format: { type: "json_object" },
				},
			);

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
	.addNode("RetrieveRelevantChunksAndBuildContext", retrieveRelevantChunksAndBuildContextNode)
	.addNode("GenerateNotes", generateNotesNode)
	.addEdge(START, "RetrieveRelevantChunksAndBuildContext")
	.addEdge("RetrieveRelevantChunksAndBuildContext", "GenerateNotes")
	.addEdge("GenerateNotes", END);

export const notesApp = workflow.compile();

export const runNotesWorkflow = async (
	documentId: string,
	highlightedText: string,
	userId: string,
) => {
	const trace = langfuse.trace({
		name: "notes-workflow",
		userId,
		tags: ["notes"],
		metadata: {
			documentId,
			highlightedText,
		},
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
