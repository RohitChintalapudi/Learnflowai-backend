import { ChatGroq } from "@langchain/groq";
import { env } from "../src/config/env";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

const FALLBACK_MODELS = [
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b"
];

export class ResilientGroqClient {
  private primaryModel: string;
  private options: any;

  constructor(modelName?: string, options?: any) {
    this.primaryModel = modelName || "groq/compound-mini";
    this.options = options || {};
  }

  private getModelList(): string[] {
    const list = [this.primaryModel];
    for (const m of FALLBACK_MODELS) {
      if (!list.includes(m)) list.push(m);
    }
    return list;
  }

  async invoke(input: BaseMessage[] | string, config?: any) {
    const models = this.getModelList();
    let lastError: any = null;

    for (const model of models) {
      try {
        const client = new ChatGroq({
          apiKey: env.GROQ_API,
          model,
          temperature: this.options.temperature ?? 0.3,
          maxTokens: this.options.maxTokens ?? 4096,
          maxRetries: 1,
        });
        return await client.invoke(input, config);
      } catch (err: any) {
        console.warn(`[Groq Warning] Model ${model} failed with ${err?.status || err?.message}. Trying fallback...`);
        lastError = err;
      }
    }
    throw lastError;
  }

  withStructuredOutput(schema: any, config?: any) {
    // Return an object that has invoke
    const self = this;
    return {
      async invoke(input: BaseMessage[] | string, runtimeConfig?: any) {
        const models = self.getModelList();
        let lastError: any = null;

        for (const model of models) {
          try {
            const client = new ChatGroq({
              apiKey: env.GROQ_API,
              model,
              temperature: self.options.temperature ?? 0.3,
              maxTokens: self.options.maxTokens ?? 4096,
              maxRetries: 1,
            });
            const structured = client.withStructuredOutput(schema, config);
            return await structured.invoke(input, runtimeConfig);
          } catch (err: any) {
            console.warn(`[Groq Structured Warning] Model ${model} failed with ${err?.status || err?.message}. Trying fallback...`);
            lastError = err;
          }
        }
        throw lastError;
      }
    };
  }
}

async function testResilience() {
  const client = new ResilientGroqClient("llama-3.1-8b-instant-invalid-model-name");
  const res = await client.invoke([new HumanMessage("Say 'Resilience Works' in 2 words")]);
  console.log("Resilience test output:", res.content);
}

testResilience();
