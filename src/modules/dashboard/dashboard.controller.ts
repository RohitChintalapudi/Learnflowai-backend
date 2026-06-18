import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const summary = await dashboardService.getDashboardSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error in getDashboardSummary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
