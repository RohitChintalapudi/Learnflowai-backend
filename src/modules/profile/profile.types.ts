export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  learningGoals?: string;
}

export interface UserStats {
  documentsCount: number;
  notesCount: number;
  quizzesCount: number;
  interviewQuestionsCount: number;
  explanationsCount: number;
}
