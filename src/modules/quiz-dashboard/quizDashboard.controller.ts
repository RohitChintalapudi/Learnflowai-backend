import { Request, Response } from "express";
import { QuizDashboardService } from "./quizDashboard.service";
import { getQuizzesQuerySchema } from "./quizDashboard.validator";

const quizDashboardService = new QuizDashboardService();

export class QuizDashboardController {
  public async getAllQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const queryResult = getQuizzesQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({ success: false, message: "Invalid query parameters" });
        return;
      }

      const { page, limit, search } = queryResult.data;

      const quizzes = await quizDashboardService.getAllQuizzes(userId, page, limit, search);

      res.status(200).json({
        success: true,
        quizzes,
      });
    } catch (error) {
      console.error("Error in getAllQuizzes:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  public async getSingleQuiz(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { quizId } = req.params;

      const quiz = await quizDashboardService.getSingleQuiz(quizId as string, userId);
      if (!quiz) {
        res.status(404).json({ success: false, message: "Quiz not found" });
        return;
      }

      // Analytics Tracking
      console.log(JSON.stringify({
        event: "QUIZ_OPENED",
        quizId,
        userId,
        timestamp: new Date().toISOString()
      }));

      console.log(JSON.stringify({
        event: "QUIZ_VIEWED",
        quizId,
        userId,
        timestamp: new Date().toISOString()
      }));

      res.status(200).json({ success: true, quiz });
    } catch (error) {
      console.error("Error in getSingleQuiz:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  public async deleteQuiz(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { quizId } = req.params;

      const deleted = await quizDashboardService.deleteQuiz(quizId as string, userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Quiz not found or unauthorized to delete" });
        return;
      }

      // Analytics Tracking
      console.log(JSON.stringify({
        event: "QUIZ_DELETED",
        quizId,
        userId,
        timestamp: new Date().toISOString()
      }));

      res.status(200).json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error in deleteQuiz:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  public async getRecentQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const quizzes = await quizDashboardService.getRecentQuizzes(userId);

      res.status(200).json({ success: true, quizzes });
    } catch (error) {
      console.error("Error in getRecentQuizzes:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  public async getQuizStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const stats = await quizDashboardService.getQuizStats(userId);

      res.status(200).json({ success: true, ...stats });
    } catch (error) {
      console.error("Error in getQuizStats:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}
