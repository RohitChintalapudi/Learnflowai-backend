import { Request, Response } from "express";
import { NotesService } from "./notes.service";
import { notesRequestSchema } from "./notes.validator";

const notesService = new NotesService();

export class NotesController {
  public async generateNotes(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validate request
      const validationResult = notesRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { documentId, highlightedText } = validationResult.data;

      // Ensure req.user is populated by auth.middleware.ts
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const userId = req.user.id;

      // 2. Call service
      const result = await notesService.generateNotes(
        documentId,
        highlightedText,
        userId
      );

      if (!result.success) {
        const statusCode = result.message?.includes("Unauthorized") ? 403 : 
                           result.message?.includes("not found") ? 404 : 400;
                           
        res.status(statusCode).json(result);
        return;
      }

      // 3. Return success response
      res.status(200).json(result);
    } catch (error) {
      console.error("NotesController error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
