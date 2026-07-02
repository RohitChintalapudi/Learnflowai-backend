import { prisma } from "../database/prisma";

export class VectorService {
    /**
     * Saves a chunk to the database along with its embedding.
     * Since embedding is an Unsupported("vector(768)") in Prisma, we first create the chunk,
     * then update its embedding via raw SQL.
     */
    async saveVector(
        documentId: string,
        chunkIndex: number,
        content: string,
        embedding: number[],
    ): Promise<void> {
        // 1. Create the chunk record (Prisma will auto-generate the CUID id)
        const chunk = await prisma.chunk.create({
            data: {
                documentId,
                chunkIndex,
                content,
            },
        });

        // 2. Only store embedding if it's non-empty (embedding service may return [] when not configured)
        if (embedding.length > 0) {
            const embeddingString = `[${embedding.join(",")}]`;
            await prisma.$executeRawUnsafe(
                "UPDATE chunks SET embedding = $1::vector WHERE id = $2",
                embeddingString,
                chunk.id,
            );
        }
    }

    /**
     * Saves multiple chunks and their embeddings to the database.
     * For simplicity and to reuse the logic, we iterate over them.
     * In a high-performance scenario, a bulk raw insert query could be constructed.
     */
    async saveVectors(
        documentId: string,
        chunks: {
            chunkIndex: number;
            content: string;
            embedding: number[];
        }[],
    ): Promise<void> {
        for (const chunk of chunks) {
            await this.saveVector(documentId, chunk.chunkIndex, chunk.content, chunk.embedding);
        }
    }

    /**
     * Deletes all chunks associated with a specific document.
     * Note: This is usually handled by Prisma's onDelete: Cascade on the relation,
     * but provided here in case explicit deletion is needed.
     */
    async deleteVectors(documentId: string): Promise<void> {
        await prisma.chunk.deleteMany({
            where: {
                documentId,
            },
        });
    }
}
