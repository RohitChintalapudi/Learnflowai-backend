import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";
import { prisma } from "../../../database";
import { runQuizWorkflow } from "./quiz.graph";
import { QuizResponse } from "./quiz.types";

export class QuizService {
  public async generateQuiz(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<QuizResponse> {
    try {
      const startTime = Date.now();

      // 1. Verify document exists and check ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, uploadedBy: true, title: true },
      });

      if (!document) {
        return { success: false, message: "Document not found" };
      }

      // If document was uploaded anonymously (uploadedBy is null), allow access.
      // Otherwise, ensure the authenticated user owns it.
      if (document.uploadedBy && document.uploadedBy !== userId) {
        return { success: false, message: "Unauthorized document access" };
      }

      // 2. Run LangGraph workflow
      const result = await runQuizWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

      // 3. Save generated quiz to DB
      const quizSet = await prisma.quizSet.create({
        data: {
          userId,
          documentId,
          highlightedText,
          quizJson: result.quiz,
        }
      });

      const totalQuestions = 
        (Array.isArray(result.quiz?.mcqs) ? result.quiz.mcqs.length : 0) +
        (Array.isArray(result.quiz?.trueFalse) ? result.quiz.trueFalse.length : 0) +
        (Array.isArray(result.quiz?.shortAnswer) ? result.quiz.shortAnswer.length : 0);

      const generatedQuiz = await prisma.generatedQuiz.create({
        data: {
          userId,
          documentId,
          title: document.title,
          highlightedText,
          quizData: result.quiz,
          totalQuestions,
        }
      });

      // 4. Analytics Event
      await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_QUIZ_GENERATED, { documentId });
      
      if (result?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          result.mainTopic, 
          ...(result.relatedConcepts || [])
        ]);
      }

      return {
        success: true,
        id: quizSet.id,
        quiz: result.quiz,
        retrievedChunks: result.retrievedChunks.length,
      };
    } catch (error) {
      console.error("Error generating quiz:", error);
      return {
        success: false,
        message: "An error occurred while generating the quiz",
      };
    }
  }

  public async getQuizzes(userId: string) {
    try {
      const quizzes = await prisma.quizSet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: { title: true }
          }
        }
      });
      return { success: true, data: quizzes };
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return { success: false, message: "Failed to fetch quizzes" };
    }
  }

  public async submitQuiz(
    quizId: string, 
    userId: string, 
    score: number, 
    totalQuestions: number, 
    topicsToImprove: string[]
  ) {
    try {
      const quiz = await prisma.quizSet.findUnique({ where: { id: quizId } });
      if (!quiz) {
        return { success: false, message: "Quiz not found" };
      }
      if (quiz.userId !== userId) {
        return { success: false, message: "Unauthorized access" };
      }

      const updatedQuiz = await prisma.quizSet.update({
        where: { id: quizId },
        data: {
          score,
          totalQuestions,
          status: "COMPLETED",
          topicsToImprove: topicsToImprove as any,
        }
      });

      return { success: true, data: updatedQuiz };
    } catch (error) {
      console.error("Error submitting quiz:", error);
      return { success: false, message: "Failed to submit quiz" };
    }
  }
}
