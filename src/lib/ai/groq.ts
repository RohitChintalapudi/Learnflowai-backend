import { ChatGroq } from "@langchain/groq";
import type { BaseMessage } from "@langchain/core/messages";
import { env } from "../../config/env";

const MODEL_MAPPING: Record<string, string> = {
	"llama-3.1-8b-instant": "groq/compound-mini",
	"llama-3.3-70b-versatile": "openai/gpt-oss-120b",
	"llama3-70b-8192": "openai/gpt-oss-120b",
	"llama3-8b-8192": "groq/compound-mini",
	"mixtral-8x7b-32768": "openai/gpt-oss-120b",
	"gemma2-9b-it": "groq/compound-mini",
};

const DEFAULT_FALLBACK_POOL = [
	"groq/compound-mini",
	"openai/gpt-oss-120b",
	"qwen/qwen3.8-27b",
	"openai/gpt-oss-20b",
];

export interface GroqClientOptions {
	temperature?: number;
	maxTokens?: number;
	maxRetries?: number;
}

export class ResilientChatGroq {
	private requestedModel: string;
	private primaryModel: string;
	private options: GroqClientOptions;

	constructor(modelName?: string, options?: GroqClientOptions) {
		if (!env.GROQ_API) {
			throw new Error("GROQ_API environment variable is missing");
		}
		this.requestedModel = modelName || "openai/gpt-oss-120b";
		this.primaryModel = MODEL_MAPPING[this.requestedModel] || this.requestedModel;
		this.options = options || {};
	}

	private getCandidateModels(): string[] {
		const models = [this.primaryModel];
		for (const fallback of DEFAULT_FALLBACK_POOL) {
			if (!models.includes(fallback)) {
				models.push(fallback);
			}
		}
		return models;
	}

	async invoke(input: BaseMessage[] | string | any, config?: any): Promise<any> {
		const candidateModels = this.getCandidateModels();
		let lastError: any = null;

		for (const model of candidateModels) {
			try {
				const client = new ChatGroq({
					apiKey: env.GROQ_API,
					model,
					temperature: this.options.temperature ?? 0.3,
					maxTokens: this.options.maxTokens ?? 4096,
					maxRetries: 1,
				});

				const response = await client.invoke(input, config);
				return response;
			} catch (error: any) {
				console.warn(
					`[Groq Client] Attempt with model '${model}' failed (status: ${error?.status || "unknown"}, msg: ${error?.message}). ${
						candidateModels.indexOf(model) < candidateModels.length - 1 ? "Trying next fallback model..." : "No more fallbacks."
					}`,
				);

				lastError = error;

				if (error?.status === 429) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}

		throw lastError;
	}

	withStructuredOutput(schema: any, structuredOptions?: any) {
		const self = this;
		return {
			async invoke(input: BaseMessage[] | string | any, runtimeConfig?: any): Promise<any> {
				const candidateModels = self.getCandidateModels();
				let lastError: any = null;

				for (const model of candidateModels) {
					try {
						const client = new ChatGroq({
							apiKey: env.GROQ_API,
							model,
							temperature: self.options.temperature ?? 0.3,
							maxTokens: self.options.maxTokens ?? 4096,
							maxRetries: 1,
						});

						const structuredLlm = client.withStructuredOutput(schema, structuredOptions);
						const response = await structuredLlm.invoke(input, runtimeConfig);
						return response;
					} catch (error: any) {
						console.warn(
							`[Groq Structured] Attempt with model '${model}' failed (status: ${error?.status || "unknown"}, msg: ${error?.message}). Trying fallback...`,
						);

						lastError = error;
						if (error?.status === 429) {
							await new Promise((resolve) => setTimeout(resolve, 1000));
						}
					}
				}

				throw lastError;
			},
		};
	}
}

export const getGroqClient = (modelName?: string, options?: GroqClientOptions): any => {
	return new ResilientChatGroq(modelName, options);
};


