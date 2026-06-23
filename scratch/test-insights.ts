import { InsightsService } from "../src/modules/analytics/insights/insights.service";

async function main() {
  try {
    console.log("Testing generateInsights...");
    // Let's assume a user ID or just create some mock logic if we don't have one
    const userId = "test-user-for-insights"; 
    const insights = await InsightsService.generateInsights(userId);
    console.log("Insights generated successfully:");
    console.log(JSON.stringify(insights, null, 2));
  } catch (error) {
    console.error("Insights error:", error);
  }
  process.exit(0);
}

main();
