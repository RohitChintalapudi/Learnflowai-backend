import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { Langfuse } from "langfuse";
import { getGroqClient } from "../../../lib/ai/groq";
import { env } from "../../../config/env";
import { INSIGHTS_SYSTEM_PROMPT, INSIGHTS_USER_PROMPT_TEMPLATE } from "./insights.prompts";
import { AnalyticsService } from "../analytics.service";
import { AIInsights } from "../analytics.types";

const langfuse = new Langfuse({
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

const GraphState = Annotation.Root({
  userId: Annotation<string>(),
  topics: Annotation<any>(),
  featureUsage: Annotation<any>(),
  consistency: Annotation<any>(),
  productivity: Annotation<any>(),
  revisions: Annotation<any>(),
  insights: Annotation<AIInsights | null>(),
  traceId: Annotation<string>(),
});

const analyticsCollectionNode = async (state: typeof GraphState.State) => {
  const { userId, traceId } = state;
  const trace = langfuse.trace({ id: traceId });
  const span = trace.span({ name: "collect-analytics" });

  const [topics, featureUsage, consistency, productivity, revisions] = await Promise.all([
    AnalyticsService.getTopics(userId),
    AnalyticsService.getFeatureUsage(userId),
    AnalyticsService.getConsistency(userId),
    AnalyticsService.getProductivity(userId),
    AnalyticsService.getRevisions(userId)
  ]);

  span.end({
    output: { consistencyScore: consistency.score, revisionCount: revisions.length }
  });

  return { topics, featureUsage, consistency, productivity, revisions };
};

const insightGenerationNode = async (state: typeof GraphState.State) => {
  const { topics, featureUsage, consistency, productivity, revisions, traceId } = state;

  const trace = langfuse.trace({ id: traceId });
  
  const userPrompt = INSIGHTS_USER_PROMPT_TEMPLATE
    .replace("{topics}", JSON.stringify(topics, null, 2))
    .replace("{featureUsage}", JSON.stringify(featureUsage, null, 2))
    .replace("{consistency}", JSON.stringify(consistency, null, 2))
    .replace("{productivity}", JSON.stringify(productivity, null, 2))
    .replace("{revisions}", JSON.stringify(revisions, null, 2));

  const generation = trace.generation({
    name: "generate-coach-insights",
    model: "llama-3.3-70b-versatile",
    modelParameters: {
      temperature: 0.2,
      maxTokens: 1000,
      responseFormat: "json_object"
    },
    input: [
      { role: "system", content: INSIGHTS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]
  });

  const groqClient = getGroqClient();
  let insights: AIInsights | null = null;

  try {
    const response = await groqClient.invoke([
      new SystemMessage(INSIGHTS_SYSTEM_PROMPT),
      new HumanMessage(userPrompt),
    ], {
      response_format: { type: "json_object" }
    });

    insights = JSON.parse(response.content as string);
    generation.end({ output: insights });
  } catch (error) {
    console.error("Error generating insights:", error);
    generation.end({ level: "ERROR", statusMessage: "Failed to parse JSON or invoke LLM" });
    throw error;
  }

  return { insights };
};

const workflow = new StateGraph(GraphState)
  .addNode("AnalyticsCollection", analyticsCollectionNode)
  .addNode("InsightGeneration", insightGenerationNode)
  .addEdge(START, "AnalyticsCollection")
  .addEdge("AnalyticsCollection", "InsightGeneration")
  .addEdge("InsightGeneration", END);

export const insightsApp = workflow.compile();
