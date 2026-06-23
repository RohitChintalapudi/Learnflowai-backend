import { prisma } from "./src/database";
import { LearningHistoryService } from "./src/modules/learning-history/learningHistory.service";

async function runTest(email: string) {
  console.log(`Looking up user with email: ${email}...`);
  
  // 1. Find the user by their email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error("❌ User not found! Please check the email address.");
    return;
  }

  console.log(`✅ Found user: ${user.name || 'No Name'} (ID: ${user.id})`);

  const service = new LearningHistoryService();

  // 2. Test the Learning History feature
  console.log("\n--- Fetching Learning History ---");
  const history = await service.getLearningHistory(user.id);
  console.log(`Found ${history.length} total history items.`);
  
  if (history.length > 0) {
    console.log("Top 3 most recent activities:");
    // Print just a summary of the top 3 items to avoid flooding the console
    const top3 = history.slice(0, 3).map(item => ({
      type: item.activityType,
      createdAt: item.createdAt,
      title_or_text: item.title || item.highlightedText?.substring(0, 50) + "...",
      score: item.score ? `${item.score}/${item.totalQuestions}` : undefined
    }));
    console.log(JSON.stringify(top3, null, 2));
  } else {
    console.log("No history found for this user.");
  }

  // 3. Test the Personalized Suggestions feature
  console.log("\n--- Generating Personalized Suggestions ---");
  console.log("Waiting for Groq AI to generate suggestions based on this history...");
  
  const suggestions = await service.getPersonalizedSuggestions(user.id);
  
  if (suggestions && suggestions.length > 0) {
    console.log("✅ Suggestions Generated Successfully:");
    console.log(JSON.stringify(suggestions, null, 2));
  } else {
    console.log("❌ No suggestions were generated. (Either the AI failed or there wasn't enough history).");
  }

  console.log("\nTest complete! ✨");
}

// Grab the email from the command line arguments
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error("❌ Please provide an email address to test.");
  console.error("Usage: pnpm tsx test-learning-history.ts <user-email>");
  process.exit(1);
}

runTest(targetEmail)
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
