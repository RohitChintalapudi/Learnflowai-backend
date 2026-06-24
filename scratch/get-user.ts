import { prisma } from "../src/database";

async function main() {
  const user = await prisma.user.findFirst();
  console.log("USER_EMAIL:", user ? user.email : "None");
}

main().catch(console.error).finally(() => prisma.$disconnect());
