import type { RetrievedChunk } from "../../../lib/rag/retrieveRelevantChunks";

export interface GeneratedNotes {
	title: string;
	summary: string;
	keyPoints: string[];
	relatedConcepts: string[];
	importantSubtopics: string[];
	examTips: string[];
	revisionNotes: string[];
}

export interface NotesState {
	documentId: string;
	highlightedText: string;
	retrievedChunks: RetrievedChunk[];
	context: string;
	notes: GeneratedNotes | null;
}

export interface NotesResponse {
	success: boolean;
	notes?: GeneratedNotes;
	retrievedChunks?: number;
	message?: string;
	noteId?: string;
}
