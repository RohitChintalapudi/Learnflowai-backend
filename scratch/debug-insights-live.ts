import { prisma } from "../src/database/prisma";
import { InsightsService } from "../src/modules/analytics/insights/insights.service";
import { AnalyticsRepository } from "../src/modules/analytics/analytics.repository";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";

async function main() {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["userId"],
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: 5,
  });

  if (grouped.length === 0) {
    console.log("No users with analytics events found.");
    return;
  }

  for (const g of grouped) {
    const user = await prisma.user.findUnique({ where: { id: g.userId } });
    console.log(`- ${user?.email ?? g.userId}: ${g._count.userId} events`);
  }

  let userId: string;
  if (process.argv[2]) {
    const user = await prisma.user.findFirst({ where: { email: process.argv[2] } });
    if (!user) {
      console.log(`No user found with email ${process.argv[2]}`);
      return;
    }
    userId = user.id;
  } else {
    userId = grouped[0].userId;
  }
  console.log(`\nUsing userId: ${userId}\n`);

  const [topics, featureUsage, consistency, productivity, revisions] = await Promise.all([
    AnalyticsRepository.getTopics(userId),
    AnalyticsRepository.getFeatureUsage(userId),
    AnalyticsService.getConsistency(userId),
    AnalyticsService.getProductivity(userId),
    AnalyticsRepository.getRevisionCandidates(userId),
  ]);
  console.log("=== INPUT DATA ===");
  console.log("topics:", JSON.stringify(topics));
  console.log("featureUsage:", JSON.stringify(featureUsage));
  console.log("consistency:", JSON.stringify(consistency));
  console.log("productivity:", JSON.stringify(productivity));
  console.log("revisions:", JSON.stringify(revisions));

  console.log("\n=== RUNNING INSIGHTS PIPELINE ===");
  const started = Date.now();
  try {
    const insights = await InsightsService.generateInsights(userId);
    console.log(`\nSucceeded in ${Date.now() - started}ms. RAW RESULT:`);
    console.log(JSON.stringify(insights, null, 2));
  } catch (error: any) {
    console.error(`\nFAILED after ${Date.now() - started}ms:`);
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
