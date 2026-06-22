import type { Request, Response } from "express";
import { AnalyticsEventType, AnalyticsTracker } from "../modules/analytics/analytics.tracker";
import { DocumentService } from "../services/document.service";

const documentService = new DocumentService();

export class DocumentController {
	async uploadDocument(req: Request, res: Response): Promise<void> {
		try {
			if (!req.file) {
				res.status(400).json({ error: "No file uploaded. Field must be named 'file'." });
				return;
			}

			// Extract the user ID from the authenticated session
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}

			const result = await documentService.processAndStoreDocument(req.file, userId);
			await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.DOCUMENT_UPLOADED, {
				fileName: req.file.originalname,
			});
			res.status(200).json(result);
		} catch (error) {
			console.error("Error in uploadDocument:", error);
			res.status(500).json({ error: (error as Error).message || "Internal server error" });
		}
	}

	async getDocuments(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}

			const documents = await documentService.getDocuments(userId);
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

	async proxyDownload(req: Request, res: Response): Promise<void> {
		try {
			const documentId = req.params.documentId as string;
			const document = await documentService.getDocumentById(documentId);

			if (!document || !document.fileUrl) {
				res.status(404).json({ error: "Document not found" });
				return;
			}

			let fetchUrl = document.fileUrl;
			if (fetchUrl.startsWith("/")) {
				const protocol = req.protocol || "http";
				const host = req.get("host") || "localhost:3000";
				fetchUrl = `${protocol}://${host}${fetchUrl}`;
			}

			const response = await fetch(fetchUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch from cloud (${fetchUrl}): ${response.status} ${response.statusText}`,
				);
			}

			const contentType = response.headers.get("content-type");
			if (contentType) {
				res.setHeader("Content-Type", contentType);
			}

			const buffer = await response.arrayBuffer();
			res.send(Buffer.from(buffer));
		} catch (error) {
			console.error("Error in proxyDownload:", error);
			require("fs").writeFileSync(
				"proxyDownloadError.log",
				String(error) + "\n" + (error as any).stack,
			);
			res.status(500).json({ error: "Internal server error: " + String(error) });
		}
	}

	async deleteDocument(req: Request, res: Response): Promise<void> {
		try {
			const documentId = req.params.documentId as string;
			const result = await documentService.deleteDocument(documentId);
			await AnalyticsTracker.trackEvent(req.user!.id, AnalyticsEventType.DOCUMENT_DELETED, {
				documentId,
			});
			res.status(200).json(result);
		} catch (error) {
			console.error("Error in deleteDocument:", error);
			res.status(500).json({ error: (error as Error).message || "Internal server error" });
		}
	}
}
