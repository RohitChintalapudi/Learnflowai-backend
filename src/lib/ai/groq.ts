import { ChatGroq } from "@langchain/groq";
import { env } from "../../config/env";

export const getGroqClient = (modelName?: string) => {
	if (!env.GROQ_API) {
		throw new Error("GROQ_API environment variable is missing");
	}

	return new ChatGroq({
		apiKey: env.GROQ_API,
		model: modelName || "llama-3.1-8b-instant",
		temperature: 0.3,
		maxTokens: 1500,
	});
};
