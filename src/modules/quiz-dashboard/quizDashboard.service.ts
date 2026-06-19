import { prisma } from "../../database";

export class QuizDashboardService {
  public async getAllQuizzes(userId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { highlightedText: { contains: search, mode: "insensitive" } },
      ];
    }

    const quizzes = await prisma.generatedQuiz.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return quizzes;
  }

  public async getSingleQuiz(quizId: string, userId: string) {
    return prisma.generatedQuiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
    });
  }

  public async deleteQuiz(quizId: string, userId: string) {
    // Delete will throw an error if the record doesn't exist.
    // However, we must ensure it belongs to the user.
    const count = await prisma.generatedQuiz.deleteMany({
      where: {
        id: quizId,
        userId,
      },
    });
    
    return count.count > 0;
  }

  public async getRecentQuizzes(userId: string) {
    return prisma.generatedQuiz.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
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

    const [totalQuizzes, thisWeek, thisMonth] = await Promise.all([
      prisma.generatedQuiz.count({ where: { userId } }),
      prisma.generatedQuiz.count({
        where: {
          userId,
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.generatedQuiz.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      totalQuizzes,
      thisWeek,
      thisMonth,
    };
  }
}
