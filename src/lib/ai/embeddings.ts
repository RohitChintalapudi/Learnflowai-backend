import { EmbeddingService } from "../../services/embedding.service";

const embeddingService = new EmbeddingService();

export const generateEmbedding = async (text: string): Promise<number[]> => {
	return await embeddingService.generateEmbedding(text);
};
