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

export function parseInterviewQuestionsResponse(text: string): {
	basic: { q: string; a: string }[];
	intermediate: { q: string; a: string }[];
	advanced: { q: string; a: string }[];
} {
	try {
		// Attempt to extract JSON from the text in case the model wraps it in markdown blocks
		const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
		const jsonString = jsonMatch ? jsonMatch[1] : text;

		const parsed = JSON.parse(jsonString);

		if (
			!Array.isArray(parsed.basic) ||
			!Array.isArray(parsed.intermediate) ||
			!Array.isArray(parsed.advanced)
		) {
			throw new Error("Invalid output format: Missing required question arrays");
		}

		return {
			basic: parsed.basic,
			intermediate: parsed.intermediate,
			advanced: parsed.advanced,
		};
	} catch (error) {
		throw new Error(`Failed to parse LLM response as JSON: ${(error as Error).message}`);
	}
}
