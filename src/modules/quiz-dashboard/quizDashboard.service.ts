import { prisma } from "../../database";

export class QuizDashboardService {
  public async getAllQuizzes(userId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (search) {
      whereClause.OR = [
        { document: { title: { contains: search, mode: "insensitive" } } },
        { highlightedText: { contains: search, mode: "insensitive" } },
      ];
    }

    const quizzes = await prisma.quizSet.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        document: { select: { title: true } }
      }
    });

    return quizzes.map(q => this.mapQuizSetToResponse(q));
  }

  private mapQuizSetToResponse(q: any) {
    const quizJson: any = q.quizJson || {};
    const totalGenQuestions = 
        (Array.isArray(quizJson.mcqs) ? quizJson.mcqs.length : 0) +
        (Array.isArray(quizJson.trueFalse) ? quizJson.trueFalse.length : 0) +
        (Array.isArray(quizJson.shortAnswer) ? quizJson.shortAnswer.length : 0);

    const response: any = {
      id: q.id,
      title: q.document?.title || "Untitled Document",
      highlightedText: q.highlightedText,
      quizData: quizJson,
      totalQuestions: totalGenQuestions,
      createdAt: q.createdAt,
    };

    if (q.score !== null) {
      response.score = q.score;
      response.totalQuestionsSubmitted = q.totalQuestions;
      response.topicsToImprove = q.topicsToImprove;
    }

    return response;
  }

  public async getSingleQuiz(quizId: string, userId: string) {
    const q = await prisma.quizSet.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        document: { select: { title: true } }
      }
    });

    if (!q) return null;
    return this.mapQuizSetToResponse(q);
  }

  public async deleteQuiz(quizId: string, userId: string) {
    const count = await prisma.quizSet.deleteMany({
      where: {
        id: quizId,
        userId,
      },
    });
    
    return count.count > 0;
  }

  public async getRecentQuizzes(userId: string) {
    const quizzes = await prisma.quizSet.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        document: { select: { title: true } }
      }
    });

    return quizzes.map(q => this.mapQuizSetToResponse(q));
  }

  public async getQuizStats(userId: string) {
    const now = new Date();
    
    // Start of this week (assuming Monday as start)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun(0) to 7
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    
    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalQuizzes, thisWeek, thisMonth, allQuizzes] = await Promise.all([
      prisma.quizSet.count({ where: { userId } }),
      prisma.quizSet.count({
        where: {
          userId,
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.quizSet.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.quizSet.findMany({
        where: { userId, status: "COMPLETED" },
        select: { score: true, totalQuestions: true }
      })
    ]);

    let totalCorrect = 0;
    let totalQuestionsAnswered = 0;

    for (const q of allQuizzes) {
      if (q.score !== null) totalCorrect += q.score;
      if (q.totalQuestions !== null) totalQuestionsAnswered += q.totalQuestions;
    }

    const averageScore = totalQuestionsAnswered > 0 
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) 
      : 0;

    return {
      totalQuizzes,
      thisWeek,
      thisMonth,
      averageScore,
      totalQuestionsAnswered,
      totalCorrect
    };
  }
}
