import { Request, Response } from "express";
import { DocumentService } from "../services/document.service";

const documentService = new DocumentService();

export class DocumentController {
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded. Field must be named 'file'." });
        return;
      }

      // In a real app, you would extract the user ID from req.user/session
      const userId = undefined;

      const result = await documentService.processAndStoreDocument(req.file, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in uploadDocument:", error);
      res.status(500).json({ error: (error as Error).message || "Internal server error" });
    }
  }

  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const documents = await documentService.getDocuments();
      res.status(200).json(documents);
    } catch (error) {
      console.error("Error in getDocuments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const document = await documentService.getDocumentById(documentId);

      if (!document) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      res.status(200).json(document);
    } catch (error) {
      console.error("Error in getDocumentById:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const result = await documentService.deleteDocument(documentId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in deleteDocument:", error);
      res.status(500).json({ error: (error as Error).message || "Internal server error" });
    }
  }
}
