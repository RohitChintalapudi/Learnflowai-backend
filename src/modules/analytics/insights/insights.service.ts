import { Langfuse } from "langfuse";
import { env } from "../../../config/env";
import { AnalyticsEventType, AnalyticsTracker } from "../analytics.tracker";
import { insightsApp } from "./insights.graph";

const langfuse = new Langfuse({
	publicKey: env.LANGFUSE_PUBLIC_KEY,
	secretKey: env.LANGFUSE_SECRET_KEY,
	baseUrl: env.LANGFUSE_BASE_URL,
});

export class InsightsService {
	static async generateInsights(userId: string) {
		const trace = langfuse.trace({
			name: "generate-ai-coach-insights",
			userId,
			tags: ["analytics", "coach"],
		});

		const initialState = {
			userId,
			topics: null,
			featureUsage: null,
			consistency: null,
			productivity: null,
			revisions: null,
			insights: null,
			traceId: trace.id,
		};

		const startTime = Date.now();
		const result = await insightsApp.invoke(initialState);
		const duration = Date.now() - startTime;

		await langfuse.flushAsync();

		// Track that insights were successfully generated
		await AnalyticsTracker.trackEvent(userId, "ANALYTICS_INSIGHTS_GENERATED", {
			durationMs: duration,
			strengthsFound: result.insights?.strengths?.length || 0,
		});

		return result.insights;
	}
}
