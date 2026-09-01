import { ChatGroq } from "@langchain/groq";
import { env } from "../src/config/env";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const testModels = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini'
];

async function run() {
  for (const model of testModels) {
    console.log(`\n--- Testing ${model} ---`);
    try {
      const client = new ChatGroq({
        apiKey: env.GROQ_API,
        model: model,
        temperature: 0.3,
        maxTokens: 500,
      });
      const res = await client.invoke([
        new SystemMessage("You are a helpful assistant."),
        new HumanMessage("Hello! Reply with JSON: {\"status\": \"ok\", \"model\": \"" + model + "\"}")
      ], {
        response_format: { type: "json_object" }
      });
      console.log(`Success ${model}:`, res.content);
    } catch (err: any) {
      console.error(`Failed ${model}:`, err?.message || err);
    }
  }
}

run();
