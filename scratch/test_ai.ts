import { getGroqClient } from "../src/lib/ai/groq";

async function run() {
  console.log("Testing llama-3.1-8b-instant...");
  try {
    const client8b = getGroqClient("llama-3.1-8b-instant");
    const res8b = await client8b.invoke("Hello, answer with single word 'Working'");
    console.log("Result 8b:", res8b.content);
  } catch (err: any) {
    console.error("Error 8b:", err?.message || err);
    if (err?.status) console.error("Status:", err.status);
    if (err?.error) console.error("Error body:", err.error);
  }

  console.log("\nTesting llama-3.3-70b-versatile...");
  try {
    const client70b = getGroqClient("llama-3.3-70b-versatile");
    const res70b = await client70b.invoke("Hello, answer with single word 'Working'");
    console.log("Result 70b:", res70b.content);
  } catch (err: any) {
    console.error("Error 70b:", err?.message || err);
    if (err?.status) console.error("Status:", err.status);
    if (err?.error) console.error("Error body:", err.error);
  }
}

run();
