import { ChatGroq } from "@langchain/groq";
import { env } from "../src/config/env";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const testModels = [
  'groq/compound-mini',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
];

async function testJson() {
  for (const m of testModels) {
    console.log(`\nTesting JSON generation for: ${m}`);
    try {
      const client = new ChatGroq({
        apiKey: env.GROQ_API,
        model: m,
        temperature: 0.2,
      });

      const res = await client.invoke([
        new SystemMessage("You are an educational assistant. Output JSON only. Format: {\"mainTopic\": string, \"keywords\": string[], \"summary\": string}"),
        new HumanMessage("Topic: React useEffect hook")
      ], {
        response_format: { type: "json_object" }
      });

      console.log(`Success ${m}:`, res.content);
      const parsed = JSON.parse(res.content as string);
      console.log(`Parsed keys for ${m}:`, Object.keys(parsed));
    } catch (e: any) {
      console.error(`Error for ${m}:`, e?.message || e);
    }
  }
}

testJson();
