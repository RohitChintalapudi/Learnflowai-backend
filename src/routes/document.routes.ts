import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router: Router = Router();
const documentController = new DocumentController();

// Apply auth middleware to all document routes
router.use(authMiddleware);

// Document ingestion routes
router.post(
  "/upload",
  uploadMiddleware.single("file"),
  documentController.uploadDocument.bind(documentController)
);

// Metadata retrieval
router.get("/", documentController.getDocuments.bind(documentController));
router.get("/:documentId", documentController.getDocumentById.bind(documentController));

// Deletion
router.delete("/:documentId", documentController.deleteDocument.bind(documentController));

export default router;
