import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { Langfuse } from "langfuse";
import { env } from "../../../config/env";
import { generateEmbedding } from "../../../lib/ai/embeddings";
import { getGroqClient } from "../../../lib/ai/groq";
import { retrieveRelevantChunks } from "../../../lib/rag/retrieveRelevantChunks";
import { conceptExpansionNode, topicDetectionNode } from "../shared/topicExpansion.nodes";
import { TopicExpansionState } from "../shared/topicExpansion.types";
import { validateMindMapJson } from "./mindmap.parser";
import { MINDMAP_SYSTEM_PROMPT, MINDMAP_USER_PROMPT } from "./mindmap.prompts";

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
	mindMapData: Annotation<any>(),
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

	const query = `${highlightedText} ${mainTopic || ""} ${(relatedConcepts || []).join(" ")} ${(subtopics || []).join(" ")}`;
	const embedding = await generateEmbedding(query);

	const chunks = await retrieveRelevantChunks(documentId, embedding, 5);

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

const generateMindMapNode = async (state: typeof GraphState.State) => {
	const { mainTopic, relatedConcepts, subtopics, prerequisites, context, traceId } = state;

	const trace = langfuse.trace({ id: traceId });

	const userPrompt = MINDMAP_USER_PROMPT.replace("{mainTopic}", mainTopic)
		.replace("{relatedConcepts}", (relatedConcepts || []).join(", "))
		.replace("{subtopics}", (subtopics || []).join(", "))
		.replace("{prerequisites}", (prerequisites || []).join(", "))
		.replace("{context}", context);

	const generation = trace.generation({
		name: "generate-mindmap",
		model: "llama-3.3-70b-versatile",
		modelParameters: {
			temperature: 0.2,
			maxTokens: 2500,
		},
		input: [
			{ role: "system", content: MINDMAP_SYSTEM_PROMPT },
			{ role: "user", content: userPrompt },
		],
	});

	const groqClient = getGroqClient("llama-3.3-70b-versatile");

	let mindMapData: any = null;

	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			const response = await groqClient.invoke(
				[new SystemMessage(MINDMAP_SYSTEM_PROMPT), new HumanMessage(userPrompt)],
				{
					response_format: { type: "json_object" },
				},
			);

			const rawResponse = response.content as string;
			const parsedJson = JSON.parse(rawResponse);

			if (validateMindMapJson(parsedJson)) {
				mindMapData = parsedJson;
				break;
			} else {
				throw new Error("Invalid mind map JSON format or failed validation rules");
			}
		} catch (error) {
			if (attempt === 2) {
				generation.end({ level: "ERROR", statusMessage: (error as Error).message });
				throw new Error(
					"Failed to generate valid JSON mind map after 2 attempts. Last error: " +
						(error as Error).message,
				);
			}
		}
	}

	generation.end({
		output: mindMapData,
	});

	return { mindMapData };
};

const workflow = new StateGraph(GraphState)
	.addNode("TopicDetection", topicDetectionNode)
	.addNode("ConceptExpansion", conceptExpansionNode)
	.addNode("RetrieveRelevantChunks", retrieveRelevantChunksNode)
	.addNode("BuildContext", buildContextNode)
	.addNode("GenerateMindMap", generateMindMapNode)
	.addEdge(START, "TopicDetection")
	.addEdge("TopicDetection", "ConceptExpansion")
	.addEdge("ConceptExpansion", "RetrieveRelevantChunks")
	.addEdge("RetrieveRelevantChunks", "BuildContext")
	.addEdge("BuildContext", "GenerateMindMap")
	.addEdge("GenerateMindMap", END);

export const mindmapApp = workflow.compile();

export const runMindMapWorkflow = async (
	documentId: string,
	highlightedText: string,
	userId: string,
) => {
	const trace = langfuse.trace({
		name: "mindmap-workflow",
		userId,
		tags: ["mindmap"],
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
		mindMapData: null,
		traceId: trace.id,
	};

	const result = await mindmapApp.invoke(initialState);

	// Wait for langfuse events to flush
	await langfuse.flushAsync();

	return result;
};
