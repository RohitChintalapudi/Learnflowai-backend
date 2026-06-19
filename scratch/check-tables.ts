import { prisma } from "../src/database";

async function main() {
  const result = await prisma.$queryRaw`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('documents', 'chunks', 'explanations', 'users', 'sessions')
  `;
  console.log("Tables in database:");
  console.log(result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
