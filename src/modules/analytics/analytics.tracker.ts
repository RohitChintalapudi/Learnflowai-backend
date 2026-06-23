import { prisma } from "../../database/prisma";

export enum AnalyticsEventType {
	DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
	AI_EXPLANATION_GENERATED = "AI_EXPLANATION_GENERATED",
	AI_NOTES_GENERATED = "AI_NOTES_GENERATED",
	AI_QUIZ_GENERATED = "AI_QUIZ_GENERATED",
	AI_INTERVIEW_QUESTIONS_GENERATED = "AI_INTERVIEW_QUESTIONS_GENERATED",
	AI_MINDMAP_GENERATED = "AI_MINDMAP_GENERATED",
	AI_ANALOGY_GENERATED = "AI_ANALOGY_GENERATED",
	AI_SIMULATION_GENERATED = "AI_SIMULATION_GENERATED",
	PROFILE_UPDATED = "PROFILE_UPDATED",
	DOCUMENT_DELETED = "DOCUMENT_DELETED",
}

export class AnalyticsTracker {
	static async trackEvent(userId: string, eventType: AnalyticsEventType | string, metadata?: any) {
		try {
			await prisma.analyticsEvent.create({
				data: {
					userId,
					eventType,
					metadata: metadata || {},
				},
			});
		} catch (error) {
			console.error("[AnalyticsTracker] Failed to track event:", error);
		}
	}

	static async trackTopics(userId: string, topics: string[]) {
		if (!topics || topics.length === 0) return;

		try {
			// Upsert each topic independently to update frequency and lastStudiedAt
			await Promise.all(
				topics.map((topic) =>
					prisma.userTopic.upsert({
						where: {
							userId_topic: {
								userId,
								topic,
							},
						},
						update: {
							frequency: {
								increment: 1,
							},
							lastStudiedAt: new Date(),
						},
						create: {
							userId,
							topic,
							frequency: 1,
							lastStudiedAt: new Date(),
						},
					}),
				),
			);
		} catch (error) {
			console.error("[AnalyticsTracker] Failed to track topics:", error);
		}
	}
}
