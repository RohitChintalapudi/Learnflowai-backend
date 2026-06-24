import type { RetrievedChunk } from "../../../lib/rag/retrieveRelevantChunks";

export interface ExplanationState {
	documentId: string;
	highlightedText: string;

	retrievedChunks: RetrievedChunk[];

	context: string;

	explanation: string;
}

export interface ExplanationRequest {
	documentId: string;
	highlightedText: string;
}

export interface ExplanationResponse {
	success: boolean;
	explanation?: string;
	retrievedChunks?: number;
	message?: string;
}
