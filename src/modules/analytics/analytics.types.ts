export interface OverviewStats {
	documentsUploaded: number;
	notesGenerated: number;
	quizzesGenerated: number;
	explanationsGenerated: number;
	interviewQuestionsGenerated: number;
	mindMapsGenerated: number;
	analogiesGenerated: number;
	totalAiInteractions: number;
}

export interface ActivityTimelineItem {
	date: string;
	count: number;
}

export interface FeatureUsageItem {
	feature: string;
	count: number;
}

export interface TopicItem {
	topic: string;
	frequency: number;
}

export interface ConsistencyScore {
	score: number;
	level: "Poor" | "Average" | "Good" | "Excellent";
	reason: string;
}

export interface ProductivityStats {
	mostActiveDay: string;
	mostActiveHour: string;
	averageDailyInteractions: number;
	totalLearningSessions: number;
}

export interface RevisionCandidate {
	topic: string;
	daysSinceLastReview: number;
	priority: "High" | "Medium" | "Low";
}

export interface AIInsights {
	strengths: string[];
	weaknesses: string[];
	recommendations: string[];
	nextActions: string[];
}
