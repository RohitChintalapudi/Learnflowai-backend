import { prisma } from "../../database/prisma";
import { AnalyticsEventType } from "./analytics.tracker";

export class AnalyticsRepository {
	static async getOverview(userId: string) {
		const events = await prisma.analyticsEvent.groupBy({
			by: ["eventType"],
			where: { userId },
			_count: { eventType: true },
		});

		const getCount = (type: string) =>
			events.find((e: any) => e.eventType === type)?._count.eventType || 0;

		const documentsUploaded = getCount(AnalyticsEventType.DOCUMENT_UPLOADED);
		const notesGenerated = getCount(AnalyticsEventType.AI_NOTES_GENERATED);
		const quizzesGenerated = getCount(AnalyticsEventType.AI_QUIZ_GENERATED);
		const explanationsGenerated = getCount(AnalyticsEventType.AI_EXPLANATION_GENERATED);
		const interviewQuestionsGenerated = getCount(
			AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED,
		);
		const mindMapsGenerated = getCount(AnalyticsEventType.AI_MINDMAP_GENERATED);
		const analogiesGenerated = getCount(AnalyticsEventType.AI_ANALOGY_GENERATED);

		const totalAiInteractions =
			notesGenerated +
			quizzesGenerated +
			explanationsGenerated +
			interviewQuestionsGenerated +
			mindMapsGenerated +
			analogiesGenerated;

		return {
			documentsUploaded,
			notesGenerated,
			quizzesGenerated,
			explanationsGenerated,
			interviewQuestionsGenerated,
			mindMapsGenerated,
			analogiesGenerated,
			totalAiInteractions,
		};
	}

	static async getActivity(userId: string, days: number) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Using raw query for proper date grouping in Postgres
		const result = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date, 
        CAST(COUNT(*) AS INTEGER) as count
      FROM "analytics_events"
      WHERE "userId" = ${userId} AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `;

		// Map raw dates to YYYY-MM-DD
		return (result as any[]).map((r) => ({
			date: new Date(r.date).toISOString().split("T")[0],
			count: r.count,
		}));
	}

	static async getFeatureUsage(userId: string) {
		const aiEvents = [
			AnalyticsEventType.AI_NOTES_GENERATED,
			AnalyticsEventType.AI_QUIZ_GENERATED,
			AnalyticsEventType.AI_EXPLANATION_GENERATED,
			AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED,
			AnalyticsEventType.AI_MINDMAP_GENERATED,
			AnalyticsEventType.AI_ANALOGY_GENERATED,
		];

		const events = await prisma.analyticsEvent.groupBy({
			by: ["eventType"],
			where: {
				userId,
				eventType: { in: aiEvents },
			},
			_count: { eventType: true },
		});

		const formatName = (type: string) => {
			return type.replace("AI_", "").replace("_GENERATED", "").replace("_", " ");
		};

		return events
			.map((e: any) => ({
				feature: formatName(e.eventType),
				count: e._count.eventType,
			}))
			.sort((a: any, b: any) => b.count - a.count);
	}

	static async getTopics(userId: string) {
		const topics = await prisma.userTopic.findMany({
			where: { userId },
			orderBy: { frequency: "desc" },
			take: 10,
		});

		return topics.map((t: any) => ({
			topic: t.topic,
			frequency: t.frequency,
		}));
	}

	static async getAllTopics(userId: string) {
		return prisma.userTopic.findMany({
			where: { userId },
		});
	}

	static async getRevisionCandidates(userId: string) {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const candidates = await prisma.userTopic.findMany({
			where: {
				userId,
				lastStudiedAt: { lt: sevenDaysAgo },
			},
			orderBy: { lastStudiedAt: "asc" },
			take: 5,
		});

		return candidates.map((c: any) => {
			const diffTime = Math.abs(new Date().getTime() - c.lastStudiedAt.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			let priority: "High" | "Medium" | "Low" = "Low";
			if (diffDays > 14) priority = "High";
			else if (diffDays > 10) priority = "Medium";

			return {
				topic: c.topic,
				daysSinceLastReview: diffDays,
				priority,
			};
		});
	}

	static async getRawEventsForProductivity(userId: string) {
		return prisma.analyticsEvent.findMany({
			where: { userId },
			select: { createdAt: true, eventType: true },
		});
	}
}
