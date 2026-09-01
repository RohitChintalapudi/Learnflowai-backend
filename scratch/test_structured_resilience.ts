import { ChatGroq } from "@langchain/groq";
import { env } from "../src/config/env";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { ResilientGroqClient } from "./test_resilient_groq";

async function testStructured() {
  const schema = z.object({
    status: z.string(),
    tags: z.array(z.string())
  });

  const client = new ResilientGroqClient("llama-3.1-8b-instant");
  const structured = client.withStructuredOutput(schema, {
    name: "Result",
    method: "jsonMode"
  });

  const res = await structured.invoke([
    new SystemMessage("Extract tags from user input and respond in JSON with status and tags fields"),
    new HumanMessage("I love TypeScript, Node.js and React!")
  ]);

  console.log("Structured result:", res);
}

testStructured();
