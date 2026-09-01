import { env } from "../src/config/env";

async function listModels() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${env.GROQ_API}`
      }
    });
    const data = await res.json();
    console.log("Model IDs:", data.data.map((m: any) => m.id));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
