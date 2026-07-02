import { prisma } from "../../database";

export class AlertsService {
  async getAlerts(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async createAlert(userId: string, title: string, message: string, type: string = "info") {
    return prisma.alert.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.alert.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async deleteAlert(userId: string, alertId: string) {
    return prisma.alert.delete({
      where: {
        id: alertId,
        userId,
      },
    });
  }

  async seedTestAlerts(userId: string) {
    const existing = await prisma.alert.count({ where: { userId } });
    if (existing > 0) {
      return { message: "Alerts already exist, skipped seeding." };
    }

    const initialAlerts = [
      {
        title: "Weekly report ready",
        message: "Your weekly AI learning progress report for June 2026 is ready to view.",
        type: "success",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2), // 2 days ago
      },
      {
        title: "Welcome to Learnflow AI!",
        message: "Upload a document to generate mind maps, revision notes, or take personalized quizzes.",
        type: "info",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5), // 5 days ago
      },
    ];

    await Promise.all(
      initialAlerts.map((alert) =>
        prisma.alert.create({
          data: {
            userId,
            title: alert.title,
            message: alert.message,
            type: alert.type,
            createdAt: alert.createdAt,
          },
        })
      )
    );

    return { message: "Test alerts seeded successfully" };
  }
}
