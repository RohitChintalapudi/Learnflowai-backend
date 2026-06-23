import { prisma } from "../src/database";

async function main() {
  const docId = "cmqmco5650000m8qlbmadxs2h";
  const document = await prisma.document.findUnique({
    where: { id: docId }
  });
  console.log("Document cmqmco5650000m8qlbmadxs2h:", document);
  
  const allDocs = await prisma.document.findMany({
    take: 5
  });
  console.log("Other documents:", allDocs);

  const allUsers = await prisma.user.findMany({
    take: 5
  });
  console.log("Users:", allUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
