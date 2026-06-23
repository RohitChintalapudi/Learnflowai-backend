import { SimulationOutput } from "./simulation.types";

export function validateSimulationJson(data: any): boolean {
	try {
		const sim = typeof data === "string" ? JSON.parse(data) : data;

		if (!sim || typeof sim !== "object") return false;
		if (typeof sim.title !== "string" || !sim.title) return false;
		if (typeof sim.simulationType !== "string") return false;
		if (typeof sim.difficulty !== "string") return false;

		if (!Array.isArray(sim.entities) || !Array.isArray(sim.steps)) return false;

		// Limits (Max 15 entities, 20 steps)
		if (sim.entities.length === 0 || sim.entities.length > 15) return false;
		if (sim.steps.length === 0 || sim.steps.length > 20) return false;

		const entityIds = new Set<string>();
		for (const entity of sim.entities) {
			if (
				!entity.id ||
				typeof entity.id !== "string" ||
				!entity.label ||
				typeof entity.label !== "string"
			) {
				return false;
			}
			entityIds.add(entity.id);
		}

		let expectedStepNumber = 1;
		for (const step of sim.steps) {
			if (
				typeof step.stepNumber !== "number" ||
				typeof step.title !== "string" ||
				typeof step.description !== "string" ||
				!Array.isArray(step.activeEntities)
			) {
				return false;
			}
			if (step.stepNumber !== expectedStepNumber) return false;
			expectedStepNumber++;

			// Validate activeEntities reference valid entities
			for (const activeEntityId of step.activeEntities) {
				if (!entityIds.has(activeEntityId)) return false;
			}
		}

		return true;
	} catch (error) {
		return false;
	}
}
