import { Request, Response } from "express";
import { LearningHistoryService } from "./learningHistory.service";

const learningHistoryService = new LearningHistoryService();

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const history = await learningHistoryService.getLearningHistory(req.user.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Error in getHistory:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const suggestions = await learningHistoryService.getPersonalizedSuggestions(req.user.id);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.error("Error in getSuggestions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
