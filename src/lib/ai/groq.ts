import { ChatGroq } from "@langchain/groq";
import { env } from "../../config/env";

export const getGroqClient = (modelName?: string) => {
	if (!env.GROQ_API) {
		throw new Error("GROQ_API environment variable is missing");
	}

	// Route versatile requests to the faster, high-limit llama-3.1-8b-instant to prevent daily limit exhaustion
	const model = (!modelName || modelName === "llama-3.1-8b-instant")
		? "llama-3.1-8b-instant"
		: modelName;

	return new ChatGroq({
		apiKey: env.GROQ_API,
		model: model,
		temperature: 0.3,
		maxTokens: 1500,
		maxRetries: 1, // Fail fast rather than hanging when rate limits are hit
	});
};
