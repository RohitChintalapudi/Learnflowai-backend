export interface AnalogyMapping {
	analogyElement: string;
	conceptElement: string;
	description: string;
}

export interface GeneratedAnalogyData {
	title: string;
	style: string;
	summary: string;
	mappings: AnalogyMapping[];
	whyItWorks: string;
	limitations: string;
}

export interface AnalogyState {
	documentId: string;
	highlightedText: string;
	style: string;
	mainTopic: string;
	relatedConcepts: string[];
	subtopics: string[];
	prerequisites: string[];
	retrievedChunks: any[];
	context: string;
	analogyData: GeneratedAnalogyData | null;
	traceId: string;
}

export interface AnalogyResponse {
	success: boolean;
	message?: string;
	analogy?: GeneratedAnalogyData & { id: string };
}
