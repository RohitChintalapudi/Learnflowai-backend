import { Prisma } from "@prisma/client";
import { prisma } from "../../database";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export const retrieveRelevantChunks = async (
  documentId: string,
  embedding: number[],
  limit: number = 5
): Promise<RetrievedChunk[]> => {
  // Use pgvector's cosine distance operator `<=>`
  // The embedding is passed as a string representation of an array
  const embeddingArrayString = `[${embedding.join(",")}]`;

  const chunks = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT id, "documentId", "chunkIndex", content,
           1 - (embedding <=> ${embeddingArrayString}::vector) as similarity
    FROM chunks
    WHERE "documentId" = ${documentId}
    ORDER BY similarity DESC
    LIMIT ${limit};
  `;

  return chunks;
};
