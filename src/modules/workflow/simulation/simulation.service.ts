import { prisma } from "../../../database/prisma";
import { AnalyticsEventType, AnalyticsTracker } from "../../analytics/analytics.tracker";
import { runSimulationWorkflow } from "./simulation.graph";
import type { SimulationOutput, SimulationResponse } from "./simulation.types";

export class SimulationService {
	public async generateSimulation(
		documentId: string,
		highlightedText: string,
		simulationType: string,
		difficulty: string,
		userId: string,
	): Promise<SimulationResponse> {
		try {
			const startTime = Date.now();

			// 1. Verify document exists and check ownership
			const document = await prisma.document.findUnique({
				where: { id: documentId },
				select: { id: true, uploadedBy: true, title: true },
			});

			if (!document) {
				return { success: false, message: "Document not found" };
			}

			// If document was uploaded anonymously (uploadedBy is null), allow access.
			// Otherwise, ensure the authenticated user owns it.
			if (document.uploadedBy && document.uploadedBy !== userId) {
				return { success: false, message: "Unauthorized document access" };
			}

			// 2. Run LangGraph workflow
			const result = await runSimulationWorkflow(
				documentId,
				highlightedText,
				userId,
				simulationType,
				difficulty,
			);

			const workflowTime = Date.now() - startTime;

			// 3. Save generated simulation to DB
			const generatedSimulation = await prisma.generatedSimulation.create({
				data: {
					documentId,
					userId,
					highlightedText,
					simulationType,
					difficulty,
					simulationData: result.simulationData || {},
				},
			});

			// 4. Analytics Event
			await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_SIMULATION_GENERATED, {
				documentId,
				simulationType,
				difficulty,
			});

			if (result?.mainTopic) {
				await AnalyticsTracker.trackTopics(userId, [
					result.mainTopic,
					...(result.relatedConcepts || []),
				]);
			}

			return {
				success: true,
				message: "Simulation generated successfully",
				simulation: {
					...(result.simulationData as SimulationOutput),
					id: generatedSimulation.id,
				},
			};
		} catch (error) {
			console.error("Error generating simulation:", error);
			return {
				success: false,
				message: "An error occurred while generating the simulation",
			};
		}
	}
}
