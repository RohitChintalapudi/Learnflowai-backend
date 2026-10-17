import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { prisma } from "../src/database/prisma";
import { AnalyticsRepository } from "../src/modules/analytics/analytics.repository";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";
import { getGroqClient } from "../src/lib/ai/groq";
import { INSIGHTS_SYSTEM_PROMPT, INSIGHTS_USER_PROMPT_TEMPLATE } from "../src/modules/analytics/insights/insights.prompts";

async function main() {
  const user = await prisma.user.findFirst({ where: { email: process.argv[2] || "rohit.chintalapudi.dev@gmail.com" } });
  if (!user) throw new Error("user not found");

  const [topics, featureUsage, consistency, productivity, revisions] = await Promise.all([
    AnalyticsRepository.getTopics(user.id),
    AnalyticsRepository.getFeatureUsage(user.id),
    AnalyticsService.getConsistency(user.id),
    AnalyticsService.getProductivity(user.id),
    AnalyticsRepository.getRevisionCandidates(user.id),
  ]);

  const userPrompt = INSIGHTS_USER_PROMPT_TEMPLATE
    .replace("{topics}", JSON.stringify(topics, null, 2))
    .replace("{featureUsage}", JSON.stringify(featureUsage, null, 2))
    .replace("{consistency}", JSON.stringify(consistency, null, 2))
    .replace("{productivity}", JSON.stringify(productivity, null, 2))
    .replace("{revisions}", JSON.stringify(revisions, null, 2));

  const groqClient = getGroqClient("llama-3.1-8b-instant");
  const response = await groqClient.invoke(
    [new SystemMessage(INSIGHTS_SYSTEM_PROMPT), new HumanMessage(userPrompt)],
    { response_format: { type: "json_object" } },
  );

  console.log("=== METADATA ===");
  console.log(JSON.stringify(response.response_metadata, null, 2));
  console.log("=== USAGE ===");
  console.log(JSON.stringify((response as any).usage_metadata, null, 2));
  console.log("=== RAW CONTENT ===");
  console.log(response.content);
  console.log("=== ADDITIONAL KWARGS ===");
  console.log(JSON.stringify((response as any).additional_kwargs, null, 2)?.slice(0, 2000));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
