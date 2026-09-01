import type { MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion } from "./quiz.types";

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

export function parseQuizResponse(text: string): {
	mcqs: MCQQuestion[];
	trueFalse: TrueFalseQuestion[];
	shortAnswer: ShortAnswerQuestion[];
} {
	try {
		const jsonString = extractJsonString(text);
		const parsed = JSON.parse(jsonString);

		if (!parsed || typeof parsed !== "object") {
			throw new Error("Invalid output format: not an object");
		}

		const mcqs = Array.isArray(parsed.mcqs) ? parsed.mcqs : [];
		const trueFalse = Array.isArray(parsed.trueFalse) ? parsed.trueFalse : [];
		const shortAnswer = Array.isArray(parsed.shortAnswer) ? parsed.shortAnswer : [];

		if (mcqs.length === 0 && trueFalse.length === 0 && shortAnswer.length === 0) {
			throw new Error("No quiz questions generated");
		}

		return {
			mcqs,
			trueFalse,
			shortAnswer,
		};
	} catch (error) {
		throw new Error("Failed to parse LLM response as JSON: " + (error as Error).message);
	}
}

