import type { SimulationEntity, SimulationOutput, SimulationStep } from "./simulation.types";

/**
 * Extracts and cleans JSON string from raw text that may contain markdown or extra spacing.
 */
export function extractJsonString(text: string): string {
	if (typeof text !== "string") return "";

	// 1. Try to find the outermost object boundaries { ... }
	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		return text.substring(firstBrace, lastBrace + 1).trim();
	}

	// 2. Try to find the outermost array boundaries [ ... ]
	const firstBracket = text.indexOf("[");
	const lastBracket = text.lastIndexOf("]");
	if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
		return text.substring(firstBracket, lastBracket + 1).trim();
	}

	// 3. Fallback to markdown block
	const markdownBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (markdownBlockMatch && markdownBlockMatch[1]) {
		return markdownBlockMatch[1].trim();
	}

	return text.trim();
}

/**
 * Parses a raw string or object into a fully validated and sanitized SimulationOutput.
 * This function is self-healing: instead of throwing on minor mismatches or missing fields,
 * it corrects them to ensure a production-ready, typed object is returned.
 */
export function parseAndSanitizeSimulation(
	data: any,
	defaultType: string = "visual-flow",
	defaultDifficulty: string = "intermediate",
	fallbackTitle: string = "AI Simulation",
): SimulationOutput {
	let sim: any;

	// 1. Safe parsing of string input
	if (typeof data === "string") {
		try {
			const jsonString = extractJsonString(data);
			sim = JSON.parse(jsonString);
		} catch (error) {
			// Fallback: create empty structure if parsing failed completely
			sim = {};
		}
	} else {
		sim = data;
	}

	if (!sim || typeof sim !== "object") {
		sim = {};
	}

	// 2. Title, Overview, Summary defaults
	const title =
		typeof sim.title === "string" && sim.title.trim() ? sim.title.trim() : fallbackTitle;

	const mainTopic =
		typeof sim.mainTopic === "string" && sim.mainTopic.trim()
			? sim.mainTopic.trim()
			: title;

	const relatedConcepts: string[] = [];
	if (Array.isArray(sim.relatedConcepts)) {
		for (const rc of sim.relatedConcepts) {
			if (typeof rc === "string" && rc.trim()) {
				relatedConcepts.push(rc.trim());
			}
		}
	}

	const overview =
		typeof sim.overview === "string" && sim.overview.trim()
			? sim.overview.trim()
			: `Simulation exploring the concepts of ${title}.`;

	const summary =
		typeof sim.summary === "string" && sim.summary.trim()
			? sim.summary.trim()
			: `This concludes the simulation walkthrough for ${title}.`;

	// 3. Normalize Enums
	let simulationType = defaultType;
	if (typeof sim.simulationType === "string") {
		const normType = sim.simulationType.trim().toLowerCase();
		if (["visual-flow", "step-by-step", "real-world"].includes(normType)) {
			simulationType = normType;
		}
	}

	let difficulty = defaultDifficulty;
	if (typeof sim.difficulty === "string") {
		const normDiff = sim.difficulty.trim().toLowerCase();
		if (["beginner", "intermediate", "advanced"].includes(normDiff)) {
			difficulty = normDiff;
		}
	}

	// 4. Sanitize Entities
	const entities: SimulationEntity[] = [];
	const entityIds = new Set<string>();

	if (Array.isArray(sim.entities)) {
		for (const entity of sim.entities) {
			if (!entity || typeof entity !== "object") continue;

			const rawId = entity.id || entity.label; // Fallback if id is missing
			if (!rawId) continue;

			const id = String(rawId).trim().toLowerCase().replace(/\s+/g, "-");
			const label =
				typeof entity.label === "string" && entity.label.trim()
					? entity.label.trim()
					: String(rawId).trim();

			const role =
				typeof entity.role === "string" && entity.role.trim()
					? entity.role.trim()
					: `Participant in ${title}`;

			// Avoid duplicate entity IDs
			if (!entityIds.has(id)) {
				entityIds.add(id);
				entities.push({ id, label, role });
			}
		}
	}

	// Limit to max 8 entities (as per rules/performance limits)
	if (entities.length > 8) {
		entities.length = 8;
		// Re-populate entityIds set to match truncated list
		entityIds.clear();
		for (const ent of entities) {
			entityIds.add(ent.id);
		}
	}

	// If no entities were generated, create a default one
	if (entities.length === 0) {
		const defaultId = "main-entity";
		entities.push({
			id: defaultId,
			label: "Core Subject",
			role: "The main focus of this simulation",
		});
		entityIds.add(defaultId);
	}

	// 5. Sanitize Steps
	const steps: SimulationStep[] = [];
	let stepCounter = 1;

	if (Array.isArray(sim.steps)) {
		for (const step of sim.steps) {
			if (!step || typeof step !== "object") continue;

			const stepTitle =
				typeof step.title === "string" && step.title.trim()
					? step.title.trim()
					: `Step ${stepCounter}`;

			const description =
				typeof step.description === "string" && step.description.trim()
					? step.description.trim()
					: `Action description for ${stepTitle}`;

			const explanation =
				typeof step.explanation === "string" && step.explanation.trim()
					? step.explanation.trim()
					: description;

			// Handle activeEntities
			const activeEntities: string[] = [];
			if (Array.isArray(step.activeEntities)) {
				for (const aeId of step.activeEntities) {
					if (typeof aeId !== "string") continue;
					const cleanedAeId = aeId.trim().toLowerCase().replace(/\s+/g, "-");
					if (entityIds.has(cleanedAeId)) {
						activeEntities.push(cleanedAeId);
					}
				}
			}

			// If no valid active entities referenced, default to the first entity
			if (activeEntities.length === 0 && entities.length > 0) {
				activeEntities.push(entities[0].id);
			}

			steps.push({
				stepNumber: stepCounter,
				title: stepTitle,
				description,
				activeEntities,
				explanation,
			});

			stepCounter++;
		}
	}

	// Limit to max 10 steps (as per rules/performance limits)
	if (steps.length > 10) {
		steps.length = 10;
	}

	// If no steps were generated, create a default one
	if (steps.length === 0) {
		steps.push({
			stepNumber: 1,
			title: "Introduction",
			description: `Introduction to ${title}`,
			activeEntities: [entities[0].id],
			explanation: `Starting state of the ${title} simulation.`,
		});
	}

	return {
		title,
		mainTopic,
		relatedConcepts,
		simulationType,
		difficulty,
		overview,
		entities,
		steps,
		summary,
	};
}

// Keep the old validator function signature so we don't break compatibility
export function validateSimulationJson(data: any): boolean {
	try {
		const sanitized = parseAndSanitizeSimulation(data);
		// If it has steps and entities, we consider it valid enough
		return sanitized.entities.length > 0 && sanitized.steps.length > 0;
	} catch (error) {
		return false;
	}
}
