import { Request, Response } from "express";
import { MindMapService } from "./mindmap.service";
import { MindMapRequestSchema } from "./mindmap.validator";

export class MindMapController {
  private mindMapService: MindMapService;

  constructor() {
    this.mindMapService = new MindMapService();
  }

  public async generateMindMap(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validate request body
      const parsedBody = MindMapRequestSchema.safeParse(req.body);

      if (!parsedBody.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsedBody.error.flatten().fieldErrors,
        });
        return;
      }

      const { documentId, highlightedText } = parsedBody.data;

      // Ensure user is authenticated via middleware
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

      // 2. Call service
      const result = await this.mindMapService.generateMindMap(
        documentId,
        highlightedText,
        user.id
      );

      // 3. Return response
      if (!result.success) {
        if (result.message === "Unauthorized document access") {
          res.status(403).json(result);
          return;
        }
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("MindMap controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  public async explainMindMap(req: Request, res: Response): Promise<void> {
    try {
      const { MindMapExplainRequestSchema } = await import("./mindmap.validator");
      const parsedBody = MindMapExplainRequestSchema.safeParse(req.body);

      if (!parsedBody.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: parsedBody.error.flatten().fieldErrors,
        });
        return;
      }

      const { mindMapId } = parsedBody.data;

      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

      const result = await this.mindMapService.explainMindMap(mindMapId, user.id);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Explain MindMap controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
