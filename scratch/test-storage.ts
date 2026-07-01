import { prisma } from "../src/database";
import { StorageSettingsService } from "../src/modules/settings/storage/storage.service";

async function main() {
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }
  const userId = users[0].id;
  console.log(`Testing storage details for user: ${users[0].name} (ID: ${userId})`);

  const service = new StorageSettingsService();
  const details = await service.getStorageDetails(userId);
  console.log("Storage Details Output:", JSON.stringify(details, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
