import { prisma } from "../../../database";

type UsageRow = { count: number; sizeBytes: number };

export class StorageSettingsService {
	public async getStorageDetails(userId: string) {
		// Sizes are aggregated as UTF-8 bytes in Postgres (OCTET_LENGTH) so multi-byte
		// content (emoji, non-Latin scripts) is measured correctly, without loading rows.
		const [documentUsage, noteUsage, quizUsage, conversationUsage] = await Promise.all([
			// Uploaded files: real file size; legacy rows missing it fall back to the
			// size of their stored extracted text instead of a fabricated estimate.
			prisma.$queryRaw<UsageRow[]>`
        SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(COALESCE(d."fileSize"::float8, c.chunk_bytes, 0)), 0)::float8 AS "sizeBytes"
        FROM documents d
        LEFT JOIN (
          SELECT "documentId", SUM(OCTET_LENGTH(content))::float8 AS chunk_bytes
          FROM chunks
          GROUP BY "documentId"
        ) c ON c."documentId" = d."id"
        WHERE d."uploadedBy" = ${userId}
      `,
			prisma.$queryRaw<UsageRow[]>`
        SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(
            OCTET_LENGTH("highlightedText") +
            OCTET_LENGTH("title") +
            OCTET_LENGTH("notes"::text)
          ), 0)::float8 AS "sizeBytes"
        FROM generated_notes
        WHERE "userId" = ${userId}
      `,
			prisma.$queryRaw<UsageRow[]>`
        SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(bytes), 0)::float8 AS "sizeBytes"
        FROM (
          SELECT OCTET_LENGTH("title") + OCTET_LENGTH("highlightedText") + OCTET_LENGTH("quizData"::text) AS bytes
          FROM generated_quizzes
          WHERE "userId" = ${userId}
          UNION ALL
          SELECT OCTET_LENGTH("highlightedText") + OCTET_LENGTH("quizJson"::text) + COALESCE(OCTET_LENGTH("topicsToImprove"::text), 0) AS bytes
          FROM quiz_sets
          WHERE "userId" = ${userId}
        ) q
      `,
			prisma.$queryRaw<UsageRow[]>`
        SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(bytes), 0)::float8 AS "sizeBytes"
        FROM (
          SELECT OCTET_LENGTH("highlightedText") + OCTET_LENGTH("explanationText") AS bytes
          FROM explanations
          WHERE "userId" = ${userId}
          UNION ALL
          SELECT OCTET_LENGTH("title") + OCTET_LENGTH("highlightedText") + OCTET_LENGTH("mindMapData"::text) AS bytes
          FROM generated_mindmaps
          WHERE "userId" = ${userId}
          UNION ALL
          SELECT OCTET_LENGTH("title") + OCTET_LENGTH("style") + OCTET_LENGTH("highlightedText") + OCTET_LENGTH("analogyData"::text) AS bytes
          FROM generated_analogies
          WHERE "userId" = ${userId}
          UNION ALL
          SELECT OCTET_LENGTH("highlightedText") + OCTET_LENGTH("simulationData"::text) AS bytes
          FROM generated_simulations
          WHERE "userId" = ${userId}
          UNION ALL
          SELECT OCTET_LENGTH("highlightedText") + OCTET_LENGTH("questionsJson"::text) AS bytes
          FROM interview_question_sets
          WHERE "userId" = ${userId}
        ) c
      `,
		]);

		const documents = documentUsage[0];
		const notes = noteUsage[0];
		const quizzes = quizUsage[0];
		const conversations = conversationUsage[0];

		const totalUsed =
			documents.sizeBytes + notes.sizeBytes + quizzes.sizeBytes + conversations.sizeBytes;
		const totalLimit = 2 * 1024 * 1024 * 1024; // 2 GB

		return {
			totalLimit,
			totalUsed,
			percentageUsed: Math.min(100, Math.round((totalUsed / totalLimit) * 100)),
			breakdown: {
				documents: {
					count: documents.count,
					sizeBytes: documents.sizeBytes,
				},
				notes: {
					count: notes.count,
					sizeBytes: notes.sizeBytes,
				},
				quizzes: {
					count: quizzes.count,
					sizeBytes: quizzes.sizeBytes,
				},
				conversations: {
					count: conversations.count,
					sizeBytes: conversations.sizeBytes,
				},
			},
		};
	}

	public async deleteCache(userId: string) {
		// Clear simulation or temporary logs if desired, or return success status
		return { success: true, message: "Cache deleted successfully" };
	}
}
