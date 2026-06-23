import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkInfo {
	chunkIndex: number;
	content: string;
}

export class ChunkService {
	private splitter: RecursiveCharacterTextSplitter;

	constructor() {
		this.splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});
	}

	/**
	 * Splits text into smaller chunks based on configured size and overlap.
	 */
	async splitText(text: string): Promise<string[]> {
		return await this.splitter.splitText(text);
	}

	/**
	 * Wraps chunks with their corresponding index for database storage.
	 */
	async createChunks(text: string): Promise<ChunkInfo[]> {
		const chunks = await this.splitText(text);
		return chunks.map((content, index) => ({
			chunkIndex: index,
			content: content.trim(),
		}));
	}
}
