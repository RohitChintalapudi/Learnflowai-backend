export interface InterviewQuestionsState {
	documentId: string;
	highlightedText: string;
	retrievedChunks: any[];
	context: string;
	questions: {
		basic: { q: string; a: string }[];
		intermediate: { q: string; a: string }[];
		advanced: { q: string; a: string }[];
	};
}

export interface InterviewQuestionsResponse {
	success: boolean;
	questions?: {
		basic: { q: string; a: string }[];
		intermediate: { q: string; a: string }[];
		advanced: { q: string; a: string }[];
	};
	retrievedChunks?: number;
	message?: string;
}

