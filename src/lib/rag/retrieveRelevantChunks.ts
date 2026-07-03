import { prisma } from "../../database";
import { toTsQuery } from "./textSearch";

export interface RetrievedChunk {
	id: string;
	documentId: string;
	chunkIndex: number;
	content: string;
}

export const retrieveRelevantChunks = async (
	documentId: string,
	queryOrEmbedding: string | number[],
	limit: number = 5,
): Promise<RetrievedChunk[]> => {
	if (typeof queryOrEmbedding === "string") {
		const tsQuery = toTsQuery(queryOrEmbedding);

		let chunks: RetrievedChunk[] = [];

		if (tsQuery) {
			try {
				chunks = await prisma.$queryRaw<RetrievedChunk[]>`
					SELECT
						id,
						"documentId",
						"chunkIndex",
						content
					FROM chunks
					WHERE
						"documentId" = ${documentId} AND to_tsvector('english', content) @@ to_tsquery('english', ${tsQuery})
					ORDER BY
						ts_rank(to_tsvector('english', content), to_tsquery('english', ${tsQuery})) DESC
					LIMIT ${limit};
				`;
			} catch (error) {
				console.error("Error during strict tsquery full-text search:", error);
			}
		}

		// Fallback 1: Try OR search if strict AND search yielded nothing
		if (chunks.length === 0) {
			const stopWords = new Set([
				"a",
				"an",
				"the",
				"and",
				"or",
				"not",
				"is",
				"are",
				"of",
				"in",
				"on",
				"at",
				"for",
				"with",
				"as",
				"by",
				"from",
				"to",
				"but",
				"this",
				"that",
				"these",
				"those",
				"it",
				"its",
				"which",
				"what",
				"when",
				"where",
				"who",
				"whom",
				"how",
				"then",
				"some",
				"any",
				"all",
				"no",
				"such",
				"my",
				"your",
				"his",
				"her",
				"its",
				"our",
				"their",
				"me",
				"him",
				"her",
				"us",
				"them",
				"i",
				"you",
				"he",
				"she",
				"it",
				"we",
				"they",
				"be",
				"been",
				"being",
				"have",
				"has",
				"had",
				"do",
				"does",
				"did",
				"can",
				"could",
				"will",
				"would",
				"should",
				"may",
				"might",
				"must",
				"about",
				"above",
				"after",
				"again",
				"against",
				"all",
				"am",
				"an",
				"and",
				"any",
				"are",
				"aren't",
				"as",
				"at",
				"be",
				"because",
				"been",
				"before",
				"being",
				"below",
				"between",
				"both",
				"but",
				"by",
				"can't",
				"cannot",
				"could",
				"couldn't",
				"did",
				"didn't",
				"do",
				"does",
				"doesn't",
				"doing",
				"don't",
				"down",
				"during",
				"each",
				"few",
				"for",
				"from",
				"further",
				"had",
				"hadn't",
				"has",
				"hasn't",
				"have",
				"haven't",
				"having",
				"he",
				"he'd",
				"he'll",
				"he's",
				"her",
				"here",
				"here's",
				"hers",
				"herself",
				"him",
				"himself",
				"his",
				"how",
				"how's",
				"i",
				"i'd",
				"i'll",
				"i'm",
				"i've",
				"if",
				"in",
				"into",
				"is",
				"isn't",
				"it",
				"it's",
				"its",
				"itself",
				"let's",
				"me",
				"more",
				"most",
				"mustn't",
				"my",
				"myself",
				"no",
				"nor",
				"not",
				"of",
				"off",
				"on",
				"once",
				"only",
				"or",
				"other",
				"ought",
				"our",
				"ours",
				"ourselves",
				"out",
				"over",
				"own",
				"same",
				"shan't",
				"she",
				"she'd",
				"she'll",
				"she's",
				"should",
				"shouldn't",
				"so",
				"some",
				"such",
				"than",
				"that",
				"that's",
				"the",
				"their",
				"theirs",
				"them",
				"themselves",
				"then",
				"there",
				"there's",
				"these",
				"they",
				"they'd",
				"they'll",
				"they're",
				"they've",
				"this",
				"those",
				"through",
				"to",
				"too",
				"under",
				"until",
				"up",
				"very",
				"was",
				"wasn't",
				"we",
				"we'd",
				"we'll",
				"we're",
				"we've",
				"were",
				"weren't",
				"what",
				"what's",
				"when",
				"when's",
				"where",
				"where's",
				"which",
				"while",
				"who",
				"who's",
				"whom",
				"why",
				"why's",
				"with",
				"won't",
				"would",
				"wouldn't",
				"you",
				"you'd",
				"you'll",
				"you're",
				"you've",
				"your",
				"yours",
				"yourself",
				"yourselves",
			]);
			const orTsQuery = queryOrEmbedding
				.toLowerCase()
				.split(/\W+/)
				.filter((word) => word.length > 2 && !stopWords.has(word))
				.join(" | ");

			if (orTsQuery) {
				try {
					chunks = await prisma.$queryRaw<RetrievedChunk[]>`
						SELECT
							id,
							"documentId",
							"chunkIndex",
							content
						FROM chunks
						WHERE
							"documentId" = ${documentId} AND to_tsvector('english', content) @@ to_tsquery('english', ${orTsQuery})
						ORDER BY
							ts_rank(to_tsvector('english', content), to_tsquery('english', ${orTsQuery})) DESC
						LIMIT ${limit};
					`;
				} catch (error) {
					console.error("Error during fallback OR tsquery search:", error);
				}
			}
		}

		// Fallback 2: Substring snippet matching
		if (chunks.length === 0 && queryOrEmbedding.length > 10) {
			try {
				const cleanQuery = queryOrEmbedding.replace(/\s+/g, " ").trim();
				const snippet = cleanQuery.substring(0, 100);
				chunks = await prisma.chunk.findMany({
					where: {
						documentId,
						content: {
							contains: snippet,
							mode: "insensitive",
						},
					},
					take: limit,
				});
			} catch (error) {
				console.error("Error during fallback snippet substring search:", error);
			}
		}

		// Fallback 3: Return the first few sequential chunks of the document
		if (chunks.length === 0) {
			try {
				chunks = await prisma.chunk.findMany({
					where: { documentId },
					orderBy: { chunkIndex: "asc" },
					take: limit,
				});
			} catch (error) {
				console.error("Error during sequential fallback search:", error);
			}
		}

		return chunks;
	} else {
		// Vector similarity search fallback
		if (queryOrEmbedding.length === 0) {
			return await prisma.chunk.findMany({
				where: { documentId },
				orderBy: { chunkIndex: "asc" },
				take: limit,
			});
		}
		const embeddingArrayString = `[${queryOrEmbedding.join(",")}]`;
		const chunks = await prisma.$queryRaw<RetrievedChunk[]>`
			SELECT id, "documentId", "chunkIndex", content
			FROM chunks
			WHERE "documentId" = ${documentId}
			ORDER BY embedding <=> ${embeddingArrayString}::vector
			LIMIT ${limit};
		`;
		return chunks;
	}
};
