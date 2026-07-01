import type { Request, Response } from "express";
import { AlertsService } from "./alerts.service";

export class AlertsController {
  private alertsService: AlertsService;

  constructor() {
    this.alertsService = new AlertsService();
  }

  public getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const alerts = await this.alertsService.getAlerts(user.id);
      res.status(200).json({ success: true, alerts });
    } catch (error: any) {
      console.error("Error in getAlerts:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await this.alertsService.markAllAsRead(user.id);
      res.status(200).json({ success: true, message: "All alerts marked as read" });
    } catch (error: any) {
      console.error("Error in markAllAsRead:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  public deleteAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;

      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, message: "Alert ID is required" });
        return;
      }

      await this.alertsService.deleteAlert(user.id, id as string);
      res.status(200).json({ success: true, message: "Alert deleted successfully" });
    } catch (error: any) {
      console.error("Error in deleteAlert:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  public seedTestAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const result = await this.alertsService.seedTestAlerts(user.id);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error in seedTestAlerts:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
