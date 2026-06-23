export interface MCQQuestion {
	question: string;
	options: string[];
	correctAnswer: string;
	topic: string;
}

export interface TrueFalseQuestion {
	question: string;
	answer: boolean;
	topic: string;
}

export interface ShortAnswerQuestion {
	question: string;
	expectedAnswer: string;
	topic: string;
}

export interface QuizState {
	documentId: string;
	highlightedText: string;
	retrievedChunks: any[];
	context: string;
	quiz: {
		mcqs: MCQQuestion[];
		trueFalse: TrueFalseQuestion[];
		shortAnswer: ShortAnswerQuestion[];
	};
	traceId: string;
}

export interface QuizResponse {
	success: boolean;
	id?: string;
	quiz?: {
		mcqs: MCQQuestion[];
		trueFalse: TrueFalseQuestion[];
		shortAnswer: ShortAnswerQuestion[];
	};
	retrievedChunks?: number;
	message?: string;
}
