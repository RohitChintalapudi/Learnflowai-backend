export function validateAnalogyJson(data: any): boolean {
	try {
		const analogy = typeof data === "string" ? JSON.parse(data) : data;

		if (!analogy || typeof analogy !== "object") return false;

		if (typeof analogy.title !== "string" || analogy.title.trim() === "") return false;
		if (typeof analogy.style !== "string" || analogy.style.trim() === "") return false;
		if (typeof analogy.summary !== "string" || analogy.summary.trim() === "") return false;
		if (typeof analogy.whyItWorks !== "string" || analogy.whyItWorks.trim() === "") return false;
		if (typeof analogy.limitations !== "string" || analogy.limitations.trim() === "") return false;

		if (!Array.isArray(analogy.mappings)) return false;
		if (analogy.mappings.length < 5 || analogy.mappings.length > 8) return false;

		for (const mapping of analogy.mappings) {
			if (
				!mapping.analogyElement ||
				typeof mapping.analogyElement !== "string" ||
				!mapping.conceptElement ||
				typeof mapping.conceptElement !== "string" ||
				!mapping.description ||
				typeof mapping.description !== "string"
			) {
				return false;
			}
		}

		return true;
	} catch (error) {
		return false;
	}
}
