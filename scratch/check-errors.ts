import { prisma } from "../src/database";

async function main() {
  const latestSims = await prisma.generatedSimulation.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Latest Generated Simulations in DB:");
  console.log(JSON.stringify(latestSims, null, 2));

  const latestEvents = await prisma.analyticsEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Latest Analytics Events:");
  console.log(JSON.stringify(latestEvents, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
