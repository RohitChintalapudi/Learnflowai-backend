import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE generated_mindmaps CASCADE;`;
  console.log("Truncated generated_mindmaps");
}

main().catch(console.error).finally(() => prisma.$disconnect());
