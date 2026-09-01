import type { GeneratedNotes } from "./notes.types";

export function extractJsonString(text: string): string {
	if (typeof text !== "string") return "";
	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		return text.substring(firstBrace, lastBrace + 1).trim();
	}
	const firstBracket = text.indexOf("[");
	const lastBracket = text.lastIndexOf("]");
	if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
		return text.substring(firstBracket, lastBracket + 1).trim();
	}
	const markdownBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (markdownBlockMatch && markdownBlockMatch[1]) {
		return markdownBlockMatch[1].trim();
	}
	return text.trim();
}

export const parseNotesResponse = (jsonString: string): GeneratedNotes | null => {
	try {
		const cleanJson = extractJsonString(jsonString);
		const parsed = JSON.parse(cleanJson);

		if (!parsed || typeof parsed !== "object") return null;

		return {
			title: typeof parsed.title === "string" ? parsed.title : "Notes",
			summary: typeof parsed.summary === "string" ? parsed.summary : "",
			keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
			relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts : [],
			importantSubtopics: Array.isArray(parsed.importantSubtopics) ? parsed.importantSubtopics : [],
			examTips: Array.isArray(parsed.examTips) ? parsed.examTips : [],
			revisionNotes: Array.isArray(parsed.revisionNotes) ? parsed.revisionNotes : [],
		};
	} catch (error) {
		console.error("Failed to parse notes response:", error);
		return null;
	}
};

