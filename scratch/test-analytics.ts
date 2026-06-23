import { AnalyticsRepository } from "../src/modules/analytics/analytics.repository";

async function main() {
  try {
    console.log("Testing getOverview...");
    const overview = await AnalyticsRepository.getOverview("test-user");
    console.log("Overview success:", overview);
  } catch (error) {
    console.error("Overview error:", error);
  }

  try {
    console.log("Testing getActivity...");
    const activity = await AnalyticsRepository.getActivity("test-user", 30);
    console.log("Activity success:", activity);
  } catch (error) {
    console.error("Activity error:", error);
  }

  process.exit(0);
}

main();
