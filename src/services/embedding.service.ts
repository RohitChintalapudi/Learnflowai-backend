export class EmbeddingService {
	/**
	 * Generates an embedding for a single string of text.
	 * STUB: This service is no longer used for RAG retrieval as full-text search is now employed.
	 * It returns a dummy empty array. If a real embedding is needed, configure an LLM provider.
	 *
	 * @param text The text to generate an embedding for.
	 */
	async generateEmbedding(text: string): Promise<number[]> {
		console.warn(
			"EmbeddingService.generateEmbedding is a stub and not used for RAG. Returning empty array.",
			text,
		);
		// In the future, call LLM provider here (e.g. OpenAI's text-embedding-ada-002)
		// const response = await llmClient.embeddings.create({ input: text, model: "text-embedding-ada-002" });
		// return response.data[0].embedding;

		return [];
	}

	/**
	 * Generates embeddings for an array of texts.
	 */
	async generateEmbeddings(texts: string[]): Promise<number[][]> {
		// This method is also a stub and not used for RAG.
		console.warn(
			"EmbeddingService.generateEmbeddings is a stub and not used for RAG. Returning empty arrays.",
			texts,
		);
		return texts.map(() => []);
	}
}
