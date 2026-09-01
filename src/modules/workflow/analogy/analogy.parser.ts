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

export function validateAnalogyJson(data: any): boolean {
	try {
		const analogy = typeof data === "string" ? JSON.parse(extractJsonString(data)) : data;

		if (!analogy || typeof analogy !== "object") return false;

		if (typeof analogy.title !== "string" || analogy.title.trim() === "") return false;
		if (typeof analogy.summary !== "string" || analogy.summary.trim() === "") return false;

		if (!Array.isArray(analogy.mappings) || analogy.mappings.length === 0) return false;

		// Ensure mappings are valid
		for (const mapping of analogy.mappings) {
			if (
				!mapping.analogyElement ||
				typeof mapping.analogyElement !== "string" ||
				!mapping.conceptElement ||
				typeof mapping.conceptElement !== "string"
			) {
				return false;
			}
		}

		return true;
	} catch (error) {
		return false;
	}
}

