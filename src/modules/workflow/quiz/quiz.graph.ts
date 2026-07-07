import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Langfuse } from "langfuse";
import { env } from "../../../config/env";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { getGroqClient } from "../../../lib/ai/groq";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { conceptExpansionNode, topicDetectionNode } from "../shared/topicExpansion.nodes";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import { parseQuizResponse } from "./quiz.parser";
import { QUIZ_SYSTEM_PROMPT, QUIZ_USER_PROMPT } from "./quiz.prompts";

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
	quiz: Annotation<any>(),
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

	// Target: 4-5 chunks max 3000 tokens (approx)
	retrievedChunks.forEach((chunk, index) => {
		context += "Chunk " + (index + 1) + ":\n" + chunk.content + "\n\n";
	});

	return { context };
};

const generateQuizNode = async (state: typeof GraphState.State) => {
	const { highlightedText, context, traceId } = state;

	const trace = langfuse.trace({ id: traceId });

	const userPrompt = QUIZ_USER_PROMPT.replace("{highlightedText}", highlightedText).replace(
		"{context}",
		context,
	);

	const generation = trace.generation({
		name: "generate-quiz",
		model: "llama-3.1-8b-instant",
		modelParameters: {
			temperature: 0.4,
			maxTokens: 2500,
			responseFormat: "json_object",
		},
		input: [
			{ role: "system", content: QUIZ_SYSTEM_PROMPT },
			{ role: "user", content: userPrompt },
		],
	});

	const groqClient = getGroqClient("llama-3.1-8b-instant");

	let parsedQuiz = { mcqs: [], trueFalse: [], shortAnswer: [] } as any;

	// Attempt JSON generation and parsing up to 2 times
	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			const response = await groqClient.invoke(
				[new SystemMessage(QUIZ_SYSTEM_PROMPT), new HumanMessage(userPrompt)],
				{
					response_format: { type: "json_object" },
				},
			);

			const rawResponse = response.content as string;
			parsedQuiz = parseQuizResponse(rawResponse);
			break; // Success
		} catch (error) {
			if (attempt === 2) {
				generation.end({ level: "ERROR", statusMessage: (error as Error).message });
				throw new Error(
					"Failed to generate valid JSON quiz after 2 attempts. Last error: " +
						(error as Error).message,
				);
			}
		}
	}

	generation.end({
		output: parsedQuiz,
	});

	return { quiz: parsedQuiz };
};

const workflow = new StateGraph(GraphState)
	.addNode("TopicDetection", topicDetectionNode)
	.addNode("ConceptExpansion", conceptExpansionNode)
	.addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
	.addNode("BuildContext", buildContextNode)
	.addNode("GenerateQuiz", generateQuizNode)
	.addEdge(START, "TopicDetection")
	.addEdge("TopicDetection", "ConceptExpansion")
	.addEdge("ConceptExpansion", "RetrieveRelevantChunks")
	.addEdge("RetrieveRelevantChunks", "BuildContext")
	.addEdge("BuildContext", "GenerateQuiz")
	.addEdge("GenerateQuiz", END);

export const quizApp = workflow.compile();

export const runQuizWorkflow = async (
	documentId: string,
	highlightedText: string,
	userId: string,
) => {
	const trace = langfuse.trace({
		name: "quiz-workflow",
		userId,
		tags: ["quiz"],
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
		quiz: { mcqs: [], trueFalse: [], shortAnswer: [] },
		traceId: trace.id,
	};

	const result = await quizApp.invoke(initialState);

	// Wait for langfuse events to flush
	await langfuse.flushAsync();

	return result;
};
