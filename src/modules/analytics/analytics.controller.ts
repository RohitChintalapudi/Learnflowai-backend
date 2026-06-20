import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service";
import { InsightsService } from "./insights/insights.service";

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getOverview(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = await AnalyticsService.getActivity(userId, days);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getFeatureUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getFeatureUsage(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getTopics(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getConsistency(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getConsistency(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getProductivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getProductivity(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getRevisions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AnalyticsService.getRevisions(userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  static async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const insights = await InsightsService.generateInsights(userId);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }
}
