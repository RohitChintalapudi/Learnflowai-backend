import type { MCQQuestion, ShortAnswerQuestion, TrueFalseQuestion } from "./quiz.types";

export function parseQuizResponse(text: string): {
	mcqs: MCQQuestion[];
	trueFalse: TrueFalseQuestion[];
	shortAnswer: ShortAnswerQuestion[];
} {
	try {
		// Attempt to extract JSON from the text in case the model wraps it in markdown blocks
		const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
		const jsonString = jsonMatch ? jsonMatch[1] : text;

		const parsed = JSON.parse(jsonString);

		if (
			!Array.isArray(parsed.mcqs) ||
			!Array.isArray(parsed.trueFalse) ||
			!Array.isArray(parsed.shortAnswer)
		) {
			throw new Error("Invalid output format: Missing required quiz arrays");
		}

		return {
			mcqs: parsed.mcqs,
			trueFalse: parsed.trueFalse,
			shortAnswer: parsed.shortAnswer,
		};
	} catch (error) {
		throw new Error("Failed to parse LLM response as JSON: " + (error as Error).message);
	}
}
