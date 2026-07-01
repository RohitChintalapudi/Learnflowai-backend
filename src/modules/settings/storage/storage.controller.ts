import type { Request, Response } from "express";
import { StorageSettingsService } from "./storage.service";

export class StorageSettingsController {
  private storageSettingsService: StorageSettingsService;

  constructor() {
    this.storageSettingsService = new StorageSettingsService();
  }

  public getStorageDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const storageDetails = await this.storageSettingsService.getStorageDetails(user.id);
      res.status(200).json({ success: true, data: storageDetails });
    } catch (error) {
      console.error("Error in getStorageDetails:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ success: false, message });
    }
  };

  public deleteCache = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const result = await this.storageSettingsService.deleteCache(user.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error in deleteCache:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ success: false, message });
    }
  };
}
