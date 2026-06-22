import { AnalyticsRepository } from "./analytics.repository";
import type { ConsistencyScore, ProductivityStats } from "./analytics.types";

export class AnalyticsService {
	static async getOverview(userId: string) {
		return AnalyticsRepository.getOverview(userId);
	}

	static async getActivity(userId: string, days: number = 30) {
		return AnalyticsRepository.getActivity(userId, days);
	}

	static async getFeatureUsage(userId: string) {
		return AnalyticsRepository.getFeatureUsage(userId);
	}

	static async getTopics(userId: string) {
		return AnalyticsRepository.getTopics(userId);
	}

	static async getRevisions(userId: string) {
		return AnalyticsRepository.getRevisionCandidates(userId);
	}

	static async getConsistency(userId: string): Promise<ConsistencyScore> {
		const activity = await AnalyticsRepository.getActivity(userId, 30);
		const featureUsage = await AnalyticsRepository.getFeatureUsage(userId);

		// 1. Active Days Score (Max 40)
		// 30 days max. If they studied 15 days, that's 50%.
		const activeDays = activity.length;
		const activeDaysScore = Math.min((activeDays / 30) * 100 * 0.4, 40);

		// 2. Streaks Score (Max 40)
		let maxStreak = 0;
		let currentStreak = 0;
		const sortedDates = [...activity].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		for (let i = 0; i < sortedDates.length; i++) {
			if (i === 0) {
				currentStreak = 1;
			} else {
				const diff =
					(new Date(sortedDates[i].date).getTime() - new Date(sortedDates[i - 1].date).getTime()) /
					(1000 * 60 * 60 * 24);
				if (diff === 1) {
					currentStreak++;
				} else {
					currentStreak = 1;
				}
			}
			if (currentStreak > maxStreak) maxStreak = currentStreak;
		}
		// A streak of 7 is considered perfect for the max 40 points
		const streakScore = Math.min((maxStreak / 7) * 100 * 0.4, 40);

		// 3. Diversity Score (Max 20)
		// Using 4 features is perfect for max 20 points
		const featuresUsed = featureUsage.length;
		const diversityScore = Math.min((featuresUsed / 4) * 100 * 0.2, 20);

		const rawScore = Math.round(activeDaysScore + streakScore + diversityScore);
		const score = Math.min(Math.max(rawScore, 0), 100);

		let level: ConsistencyScore["level"] = "Poor";
		let reason = "Low activity detected. Start generating notes and taking quizzes!";

		if (score > 80) {
			level = "Excellent";
			reason = "Consistent activity and diverse feature usage. Keep it up!";
		} else if (score > 60) {
			level = "Good";
			reason = "Solid study habits! Try extending your daily streaks.";
		} else if (score > 30) {
			level = "Average";
			reason = "You are making progress, but aim for more regular study sessions.";
		}

		// Edge case: no activity
		if (activeDays === 0) {
			level = "Poor";
			reason = "No activity in the last 30 days.";
		}

		return { score, level, reason };
	}

	static async getProductivity(userId: string): Promise<ProductivityStats> {
		const events = await AnalyticsRepository.getRawEventsForProductivity(userId);

		if (events.length === 0) {
			return {
				mostActiveDay: "None",
				mostActiveHour: "None",
				averageDailyInteractions: 0,
				totalLearningSessions: 0,
			};
		}

		const dayCounts: Record<string, number> = {};
		const hourCounts: Record<string, number> = {};
		const dateSet = new Set<string>();

		const daysOfWeek = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		];

		for (const e of events) {
			const d = new Date(e.createdAt);
			const dayName = daysOfWeek[d.getDay()];
			const hourStr = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }); // e.g. "8 PM"
			const dateStr = d.toISOString().split("T")[0];

			dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
			hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
			dateSet.add(dateStr);
		}

		let mostActiveDay = "None";
		let maxDayCount = 0;
		for (const [day, count] of Object.entries(dayCounts)) {
			if (count > maxDayCount) {
				maxDayCount = count;
				mostActiveDay = day;
			}
		}

		let mostActiveHour = "None";
		let maxHourCount = 0;
		for (const [hour, count] of Object.entries(hourCounts)) {
			if (count > maxHourCount) {
				maxHourCount = count;
				mostActiveHour = hour;
			}
		}

		const activeDaysCount = dateSet.size;
		const averageDailyInteractions =
			activeDaysCount > 0 ? Math.round(events.length / activeDaysCount) : 0;

		// Estimate learning sessions. Group events by 30-minute intervals.
		let totalLearningSessions = 0;
		const sortedEvents = [...events].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		);

		if (sortedEvents.length > 0) {
			totalLearningSessions = 1;
			for (let i = 1; i < sortedEvents.length; i++) {
				const diffMs =
					new Date(sortedEvents[i].createdAt).getTime() -
					new Date(sortedEvents[i - 1].createdAt).getTime();
				// If more than 30 mins passed between events, it's a new session
				if (diffMs > 30 * 60 * 1000) {
					totalLearningSessions++;
				}
			}
		}

		return {
			mostActiveDay,
			mostActiveHour,
			averageDailyInteractions,
			totalLearningSessions,
		};
	}
}
