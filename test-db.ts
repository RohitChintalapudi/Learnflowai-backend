import 'dotenv/config';
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const docs = await prisma.document.findMany({
    select: { id: true, title: true, fileType: true }
  });
  console.log(JSON.stringify(docs, null, 2));
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
