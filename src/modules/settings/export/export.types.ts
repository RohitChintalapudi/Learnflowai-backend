import type {
	AnalyticsEvent,
	Document,
	Explanation,
	GeneratedAnalogy,
	GeneratedMindMap,
	GeneratedNote,
	GeneratedQuiz,
	GeneratedSimulation,
	InterviewQuestionSet,
	QuizSet,
	User,
	UserTopic,
} from "@prisma/client";

export interface ExportData {
	profile: Omit<User, "image"> & { profileImage: string | null };
	notes: GeneratedNote[];
	quizzes: GeneratedQuiz[];
	mindMaps: GeneratedMindMap[];
	analytics: AnalyticsEvent[];
	explanations: Explanation[];
	interviewQuestionSets: InterviewQuestionSet[];
	quizSets: QuizSet[];
	analogies: GeneratedAnalogy[];
	simulations: GeneratedSimulation[];
	userTopics: UserTopic[];
	documents: Document[];
	exportedAt: string;
}

export interface ExportResponse {
	success: boolean;
	data: ExportData;
}
