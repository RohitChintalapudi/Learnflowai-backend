import { env } from "../src/config/env";

const models = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'groq/compound',
  'groq/compound-mini'
];

async function checkLimits() {
  for (const m of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5
        })
      });
      console.log(`\nModel: ${m}, status: ${res.status}`);
      console.log("x-ratelimit-limit-requests:", res.headers.get("x-ratelimit-limit-requests"));
      console.log("x-ratelimit-limit-tokens:", res.headers.get("x-ratelimit-limit-tokens"));
      console.log("x-ratelimit-remaining-tokens:", res.headers.get("x-ratelimit-remaining-tokens"));
      console.log("x-ratelimit-limit-tokens-per-minute:", res.headers.get("x-ratelimit-limit-tokens-per-minute") || res.headers.get("x-ratelimit-limit-tokens"));
    } catch (e: any) {
      console.error(`Error for ${m}:`, e?.message);
    }
  }
}

checkLimits();
