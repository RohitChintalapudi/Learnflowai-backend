import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Langfuse } from "langfuse";
import { z } from "zod";
import { env } from "../../../config/env";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { getGroqClient } from "../../../lib/ai/groq";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { topicDetectionNode } from "../shared/topicExpansion.nodes";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import {
	INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
	INTERVIEW_QUESTIONS_USER_PROMPT,
} from "./interviewQuestions.prompts";

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

	// 1. Generate embedding for query using only the highlighted text for speed
	const embedding = await generateEmbedding(highlightedText);

	// 2. Fetch top chunks
	const chunks = await retrieveRelevantChunks(documentId, embedding, 5);

	span.end({
		output: { chunkCount: chunks.length, retrievedChunks: chunks },
	});

	return {
		retrievedChunks: chunks,
	};
};

const analyzeAndRetrieveNode = async (state: typeof GraphState.State) => {
	// Run topic detection and retrieval in parallel to completely hide retrieval latency
	const [topicResult, retrieveResult] = await Promise.all([
		topicDetectionNode(state),
		retrieveRelevantChunksNode(state),
	]);

	return {
		...topicResult,
		...retrieveResult,
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

	retrievedChunks.forEach((chunk: any, index: number) => {
		context += "Chunk " + (index + 1) + ":\n" + chunk.content + "\n\n";
	});

	return { context };
};

const QuestionsSchema = z.object({
	questions: z.array(
		z.object({
			q: z.string(),
			a: z.string(),
		}),
	),
});

const generateQuestionsNode = async (state: typeof GraphState.State) => {
	const { highlightedText, context, traceId } = state;

	const trace = langfuse.trace({ id: traceId });

	const generateLevel = async (difficulty: string, modelName: string) => {
		const generation = trace.generation({
			name: `generate-${difficulty.toLowerCase()}-questions`,
			model: modelName,
			input: { highlightedText, context, difficulty },
		});

		const groqClient = getGroqClient(modelName);
		
		// Use Zod schema validation
		const structuredLlm = groqClient.withStructuredOutput(QuestionsSchema, { name: "Questions" });

		const sysPrompt = INTERVIEW_QUESTIONS_SYSTEM_PROMPT.replace("{difficulty}", difficulty);
		const usrPrompt = INTERVIEW_QUESTIONS_USER_PROMPT.replace("{highlightedText}", highlightedText)
			.replace("{context}", context)
			.replace("{difficulty}", difficulty);

		const response = await structuredLlm.invoke([
			new SystemMessage(sysPrompt),
			new HumanMessage(usrPrompt),
		]);

		generation.end({
			output: response,
		});

		return response.questions;
	};

	// Execute 3 parallel generations to drastically cut down time
	const [basic, intermediate, advanced] = await Promise.all([
		generateLevel("Basic", "llama-3.1-8b-instant"),
		generateLevel("Intermediate", "llama-3.1-8b-instant"),
		generateLevel("Advanced", "llama-3.3-70b-versatile"),
	]);

	return { questions: { basic, intermediate, advanced } };
};

const workflow = new StateGraph(GraphState)
	.addNode("AnalyzeAndRetrieve", analyzeAndRetrieveNode)
	.addNode("BuildContext", buildContextNode)
	.addNode("GenerateQuestions", generateQuestionsNode)
	.addEdge(START, "AnalyzeAndRetrieve")
	.addEdge("AnalyzeAndRetrieve", "BuildContext")
	.addEdge("BuildContext", "GenerateQuestions")
	.addEdge("GenerateQuestions", END);

export const interviewQuestionsApp = workflow.compile();

export const runInterviewQuestionsWorkflow = async (
	documentId: string,
	highlightedText: string,
	userId: string,
) => {
	const trace = langfuse.trace({
		name: "interview-questions-workflow",
		userId,
		tags: ["interview-questions"],
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
		questions: { basic: [], intermediate: [], advanced: [] },
		traceId: trace.id,
	};

	const result = await interviewQuestionsApp.invoke(initialState);

	// Wait for langfuse events to flush
	await langfuse.flushAsync();

	return result;
};
