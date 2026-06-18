import fs from "node:fs/promises";
import { prisma } from "../database/prisma";
import { StorageService } from "./storage.service";
import { DocumentParserService } from "./documentParser.service";
import { ChunkService } from "./chunk.service";
import { EmbeddingService } from "./embedding.service";
import { VectorService } from "./vector.service";

export class DocumentService {
  private storageService: StorageService;
  private documentParserService: DocumentParserService;
  private chunkService: ChunkService;
  private embeddingService: EmbeddingService;
  private vectorService: VectorService;

  constructor() {
    this.storageService = new StorageService();
    this.documentParserService = new DocumentParserService();
    this.chunkService = new ChunkService();
    this.embeddingService = new EmbeddingService();
    this.vectorService = new VectorService();
  }

  async processAndStoreDocument(file: Express.Multer.File, userId?: string) {
    try {
      // 1. Extract text and metadata
      const parsedData = await this.documentParserService.extractText(file);
      
      // 2. Save the file URL using StorageService so the frontend can view it
      const fileUrl = await this.storageService.uploadFile(file);

      // 3. Create document record in database
      const document = await prisma.document.create({
        data: {
          title: file.originalname,
          fileName: file.filename,
          fileType: parsedData.fileType,
          fileUrl: fileUrl,
          totalPages: parsedData.totalPages,
          uploadedBy: userId || null,
        }
      });

      // 4. Chunk the extracted text
      const chunksInfo = await this.chunkService.createChunks(parsedData.text);

      // 5. Generate embeddings and store vectors
      const BATCH_SIZE = 50;
      for (let i = 0; i < chunksInfo.length; i += BATCH_SIZE) {
        const batchChunks = chunksInfo.slice(i, i + BATCH_SIZE);
        const textsToEmbed = batchChunks.map(c => c.content);
        
        const embeddings = await this.embeddingService.generateEmbeddings(textsToEmbed);
        
        const chunksWithEmbeddings = batchChunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddings[index]
        }));

        await this.vectorService.saveVectors(document.id, chunksWithEmbeddings);
      }

      return {
        success: true,
        documentId: document.id,
        title: document.title,
        fileType: document.fileType,
        totalChunks: chunksInfo.length
      };
    } catch (error) {
      // Cleanup the temporary file only if processing failed
      if (file.path) {
        await fs.unlink(file.path).catch((err) => 
          console.error(`Failed to delete temporary file ${file.path}:`, err)
        );
      }
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
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
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
        totalPages: true
      }
    });
  }

  async deleteDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // 1. Delete the physical file
    if (document.fileUrl) {
      await this.storageService.deleteFile(document.fileUrl);
    }

    // 2. Vectors and Chunks will be deleted automatically due to Prisma's CASCADE delete
    // Delete the document record
    await prisma.document.delete({
      where: { id: documentId }
    });

    return { success: true };
  }
}
