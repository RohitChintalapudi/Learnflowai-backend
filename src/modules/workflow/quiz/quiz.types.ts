export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface TrueFalseQuestion {
  question: string;
  answer: boolean;
}

export interface ShortAnswerQuestion {
  question: string;
  expectedAnswer: string;
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
  quiz?: {
    mcqs: MCQQuestion[];
    trueFalse: TrueFalseQuestion[];
    shortAnswer: ShortAnswerQuestion[];
  };
  retrievedChunks?: number;
  message?: string;
}
