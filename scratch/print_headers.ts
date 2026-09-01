import { env } from "../src/config/env";

async function printAllHeaders() {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "groq/compound-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    })
  });
  console.log("All Headers from groq/compound-mini:");
  for (const [key, value] of res.headers.entries()) {
    if (key.includes("ratelimit") || key.includes("limit") || key.includes("remaining")) {
      console.log(`${key}: ${value}`);
    }
  }

  const res120b = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    })
  });
  console.log("\nAll Headers from openai/gpt-oss-120b:");
  for (const [key, value] of res120b.headers.entries()) {
    if (key.includes("ratelimit") || key.includes("limit") || key.includes("remaining")) {
      console.log(`${key}: ${value}`);
    }
  }
}

printAllHeaders();
