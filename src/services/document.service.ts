import { prisma } from "../database/prisma";
import { CloudinaryService } from "../lib/storage/cloudinary.service";
import { ChunkService } from "./chunk.service";
import { DocumentParserService } from "./documentParser.service";
import { EmbeddingService } from "./embedding.service";
import { VectorService } from "./vector.service";

export class DocumentService {
	private cloudinaryService: CloudinaryService;
	private documentParserService: DocumentParserService;
	private chunkService: ChunkService;
	private embeddingService: EmbeddingService;
	private vectorService: VectorService;

	constructor() {
		this.cloudinaryService = new CloudinaryService();
		this.documentParserService = new DocumentParserService();
		this.chunkService = new ChunkService();
		this.embeddingService = new EmbeddingService();
		this.vectorService = new VectorService();
	}

	async processAndStoreDocument(file: Express.Multer.File, userId?: string) {
		try {
			if (!file.buffer) {
				throw new Error("File buffer is missing");
			}

			// 1. Upload to Cloudinary
			const uploadResult = await this.cloudinaryService.uploadBuffer(
				file.buffer,
				file.originalname,
				"raw",
			);

			// 2. Extract text and metadata
			const parsedData = await this.documentParserService.extractText(file);

			// 3. Create document record in database
			const document = await prisma.document.create({
				data: {
					title: file.originalname,
					fileName: file.originalname,
					fileType: parsedData.fileType,
					fileUrl: uploadResult.secureUrl,
					cloudinaryPublicId: uploadResult.publicId,
					fileSize: uploadResult.bytes,
					totalPages: parsedData.totalPages,
					uploadedBy: userId || null,
				},
			});

			// 4. Chunk the extracted text
			const chunksInfo = await this.chunkService.createChunks(parsedData.text);

			// 5. Generate embeddings and store vectors
			const BATCH_SIZE = 50;
			for (let i = 0; i < chunksInfo.length; i += BATCH_SIZE) {
				const batchChunks = chunksInfo.slice(i, i + BATCH_SIZE);
				const textsToEmbed = batchChunks.map((c) => c.content);

				const embeddings = await this.embeddingService.generateEmbeddings(textsToEmbed);

				const chunksWithEmbeddings = batchChunks.map((chunk, index) => ({
					...chunk,
					embedding: embeddings[index],
				}));

				await this.vectorService.saveVectors(document.id, chunksWithEmbeddings);
			}

			return {
				success: true,
				documentId: document.id,
				title: document.title,
				fileType: document.fileType,
				totalChunks: chunksInfo.length,
			};
		} catch (error) {
			console.error("Failed to process and store document:", error);
			throw error;
		}
	}

	async getDocuments(userId: string) {
		return prisma.document.findMany({
			where: {
				uploadedBy: userId,
			},
			select: {
				id: true,
				title: true,
				fileType: true,
				totalPages: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	async getDocumentById(documentId: string) {
		return prisma.document.findUnique({
			where: { id: documentId },
			select: {
				id: true,
				title: true,
				fileType: true,
				fileUrl: true,
				totalPages: true,
			},
		});
	}

	async deleteDocument(documentId: string) {
		const document = await prisma.document.findUnique({
			where: { id: documentId },
		});

		if (!document) {
			throw new Error("Document not found");
		}

		// 1. Delete the cloud asset
		if (document.cloudinaryPublicId) {
			await this.cloudinaryService.deleteFile(document.cloudinaryPublicId);
		}

		// 2. Vectors and Chunks will be deleted automatically due to Prisma's CASCADE delete
		// Delete the document record
		await prisma.document.delete({
			where: { id: documentId },
		});

		return { success: true };
	}
}
