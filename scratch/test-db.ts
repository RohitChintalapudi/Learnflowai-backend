import { prisma } from "../src/database/prisma";

async function main() {
  try {
    const count = await prisma.generatedAnalogy.count();
    console.log("Table exists! Count:", count);
  } catch (err) {
    console.error("Error querying table:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
