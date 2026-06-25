import { prisma } from "./src/database";
import { AccountSettingsService } from "./src/modules/settings/account/account.service";

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

  const service = new AccountSettingsService();

  // 2. Test the Account Settings details retrieval
  console.log("\n--- Fetching Account Settings Details ---");
  const details = await service.getAccountDetails(user.id);
  console.log("✅ Details Retrieved successfully:");
  console.log(JSON.stringify(details, null, 2));

  console.log("\nTest complete! ✨");
}

// Grab the email from the command line arguments
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error("❌ Please provide an email address to test.");
  console.error("Usage: pnpm tsx test-account-settings.ts <user-email>");
  process.exit(1);
}

runTest(targetEmail)
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
