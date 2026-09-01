import { prisma } from "../src/database";

async function checkDb() {
  try {
    const userCount = await prisma.user.count();
    const docCount = await prisma.document.count();
    const chunkCount = await prisma.chunk.count();
    const docs = await prisma.document.findMany({ take: 5, include: { chunks: { take: 1 } } });
    console.log({ userCount, docCount, chunkCount, docs: docs.map(d => ({ id: d.id, title: d.title, chunkCount: d.chunks.length })) });
  } catch (err) {
    console.error("DB check failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
