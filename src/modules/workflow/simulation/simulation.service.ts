import type { Prisma } from "@prisma/client";
import { prisma } from "../../../database";
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

			// 3. Save generated simulation to DB
			const generatedSimulation = await prisma.generatedSimulation.create({
				data: {
					documentId,
					userId,
					highlightedText,
					simulationType,
					difficulty,
   simulationData: (result.simulationData || {}) as Prisma.InputJsonValue,
				},
			});

			// 4. Create In-App Alert
			await prisma.alert.create({
				data: {
					userId,
					title: "Simulation generated",
					message: `Educational simulation "${(result.simulationData as any)?.title || "Simulation"}" generated successfully for "${document.title}".`,
					type: "success",
				},
			});

			// 5. Analytics Event
			await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_SIMULATION_GENERATED, {
				documentId,
				simulationType,
				difficulty,
			}).catch((err) => console.error("[SimulationService] Error tracking analytics event:", err));

			const mainTopic = result?.simulationData?.mainTopic || result?.mainTopic;
			const relatedConcepts = result?.simulationData?.relatedConcepts || result?.relatedConcepts;

			if (mainTopic) {
				AnalyticsTracker.trackTopics(userId, [mainTopic, ...(relatedConcepts || [])])
					.catch((err) => console.error("[SimulationService] Error tracking topics:", err));
			}

			if (!result.simulationData) {
				return {
					success: false,
					message: "Failed to generate simulation details",
				};
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
