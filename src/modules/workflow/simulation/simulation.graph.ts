import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Langfuse } from "langfuse";
import { env } from "../../../config/env";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { getGroqClient } from "../../../lib/ai/groq";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { conceptExpansionNode, topicDetectionNode } from "../shared/topicExpansion.nodes";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import { parseAndSanitizeSimulation } from "./simulation.parser";
import { SIMULATION_SYSTEM_PROMPT, SIMULATION_USER_PROMPT } from "./simulation.prompts";
import type { SimulationOutput } from "./simulation.types";

const langfuse = new Langfuse({
	publicKey: env.LANGFUSE_PUBLIC_KEY,
	secretKey: env.LANGFUSE_SECRET_KEY,
	baseUrl: env.LANGFUSE_BASE_URL,
});

const GraphState = Annotation.Root({
	...TopicExpansionState,
	documentId: Annotation<string>(),
	highlightedText: Annotation<string>(),
	simulationType: Annotation<string>(),
	difficulty: Annotation<string>(),
	retrievedChunks: Annotation<any[]>(),
	context: Annotation<string>(),
	simulationData: Annotation<SimulationOutput | null>(),
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

	// Generate embedding on the highlightedText directly for fast parallel retrieval
	const embedding = await generateEmbedding(highlightedText);
	const chunks = await retrieveRelevantChunks(documentId, embedding, 3);

	const duration = Date.now() - startTime;
	span.end({
		output: { chunkCount: chunks.length, duration },
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
		context += "Chunk " + (index + 1) + ":\n" + chunk.content + "\n\n";
	});

	return { context };
};

const generateSimulationNode = async (state: typeof GraphState.State) => {
	const {
		mainTopic,
		highlightedText,
		relatedConcepts,
		subtopics,
		context,
		traceId,
		simulationType,
		difficulty,
	} = state;

	const trace = langfuse.trace({ id: traceId });

	const groqClient = getGroqClient("llama-3.3-70b-versatile");

	let simulationData: any = null;
	let lastError: Error | null = null;
	let rawResponse = "";

	for (let attempt = 1; attempt <= 2; attempt++) {
		const userPrompt = SIMULATION_USER_PROMPT.replace("{mainTopic}", mainTopic || "")
			.replace("{highlightedText}", highlightedText || "")
			.replace("{relatedConcepts}", (relatedConcepts || []).join(", "))
			.replace("{subtopics}", (subtopics || []).join(", "))
			.replace("{context}", context)
			.replace("{simulationType}", simulationType)
			.replace("{difficulty}", difficulty);

		let finalPrompt = userPrompt;
		if (attempt > 1 && lastError) {
			finalPrompt = `${userPrompt}\n\nWARNING: Your previous attempt failed validation/parsing with error: "${lastError.message}".\nYour previous JSON output was:\n${rawResponse}\n\nPlease analyze the error, correct the JSON structure, and output the fully corrected JSON. Follow all rules strictly.`;
		}

		const generation = trace.generation({
			name: `generate-simulation-attempt-${attempt}`,
			model: "llama-3.3-70b-versatile",
			modelParameters: {
				temperature: attempt === 1 ? 0.2 : 0.4,
				maxTokens: 1500,
			},
			input: [
				{ role: "system", content: SIMULATION_SYSTEM_PROMPT },
				{ role: "user", content: finalPrompt },
			],
		});

		try {
			const response = await groqClient.invoke(
				[new SystemMessage(SIMULATION_SYSTEM_PROMPT), new HumanMessage(finalPrompt)],
				{
					response_format: { type: "json_object" },
				},
			);

			rawResponse = response.content as string;

			// Parse and heal JSON output
			const sanitized = parseAndSanitizeSimulation(
				rawResponse,
				simulationType,
				difficulty,
				mainTopic ? `${mainTopic} Simulation` : "AI Simulation",
			);

			if (sanitized.entities.length > 0 && sanitized.steps.length > 0) {
				simulationData = sanitized;
				generation.end({
					output: simulationData,
				});
				break;
			} else {
				throw new Error("Sanitization failed to produce any valid entities or steps");
			}
		} catch (error) {
			lastError = error as Error;

			if (attempt === 2) {
				generation.end({ level: "ERROR", statusMessage: (error as Error).message });
				throw new Error(
					"Failed to generate valid JSON simulation after 2 attempts. Last error: " +
						(error as Error).message,
				);
			} else {
				generation.end({ level: "WARNING", statusMessage: (error as Error).message });
			}
		}
	}

	return { simulationData };
};

const workflow = new StateGraph(GraphState)
	.addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
	.addNode("BuildContext", buildContextNode)
	.addNode("GenerateSimulation", generateSimulationNode)
	.addEdge(START, "RetrieveRelevantChunks")
	.addEdge("RetrieveRelevantChunks", "BuildContext")
	.addEdge("BuildContext", "GenerateSimulation")
	.addEdge("GenerateSimulation", END);

export const simulationApp = workflow.compile();

export const runSimulationWorkflow = async (
	documentId: string,
	highlightedText: string,
	userId: string,
	simulationType: string,
	difficulty: string,
) => {
	const trace = langfuse.trace({
		name: "simulation-workflow",
		userId,
		tags: ["simulation"],
		metadata: {
			documentId,
			highlightedText,
			simulationType,
			difficulty,
		},
	});

	const initialState = {
		documentId,
		highlightedText,
		simulationType,
		difficulty,
		mainTopic: "",
		keywords: [],
		subjectArea: "",
		relatedConcepts: [],
		subtopics: [],
		prerequisites: [],
		retrievedChunks: [],
		context: "",
		simulationData: null,
		traceId: trace.id,
	};

	const result = await simulationApp.invoke(initialState);

	// Wait for langfuse events to flush
	await langfuse.flushAsync();

	return result;
};
