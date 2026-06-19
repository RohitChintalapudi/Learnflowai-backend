import { ChatGroq } from "@langchain/groq";
import { env } from "../../config/env";

export const getGroqClient = () => {
  if (!env.GROQ_API) {
    throw new Error("GROQ_API environment variable is missing");
  }

  return new ChatGroq({
    apiKey: env.GROQ_API,
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    maxTokens: 1500,
  });
};
