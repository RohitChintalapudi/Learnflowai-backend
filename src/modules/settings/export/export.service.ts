import { prisma } from "../../../database";
import type { ExportData } from "./export.types";

export class ExportService {
	public async exportUserData(userId: string): Promise<ExportData> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new Error("User not found");
		}

		const fetchDataset = async (name: string, queryFn: () => Promise<any>) => {
			console.log(`Querying dataset: ${name}`);
			try {
				const result = await queryFn();
				return result;
			} catch (error: any) {
				console.error(`Failed to query dataset ${name}:`, error.message);
				return [];
			}
		};

		// Fetch all user-related data concurrently using Promise.all
		const [
			notes,
			quizzes,
			mindMaps,
			analytics,
			explanations,
			interviewQuestionSets,
			quizSets,
			analogies,
			simulations,
			userTopics,
			documents,
		] = await Promise.all([
			fetchDataset("notes", () => prisma.generatedNote.findMany({ where: { userId } })),
			fetchDataset("quizzes", () => prisma.generatedQuiz.findMany({ where: { userId } })),
			fetchDataset("mindMaps", () => prisma.generatedMindMap.findMany({ where: { userId } })),
			fetchDataset("analytics", () => prisma.analyticsEvent.findMany({ where: { userId } })),
			fetchDataset("explanations", () => prisma.explanation.findMany({ where: { userId } })),
			fetchDataset("interviewQuestionSets", () => prisma.interviewQuestionSet.findMany({ where: { userId } })),
			fetchDataset("quizSets", () => prisma.quizSet.findMany({ where: { userId } })),
			fetchDataset("analogies", () => prisma.generatedAnalogy.findMany({ where: { userId } })),
			fetchDataset("simulations", () => prisma.generatedSimulation.findMany({ where: { userId } })),
			fetchDataset("userTopics", () => prisma.userTopic.findMany({ where: { userId } })),
			fetchDataset("documents", () => prisma.document.findMany({ where: { uploadedBy: userId } })),
		]);

		const { image, ...userWithoutImage } = user;

		return {
			profile: {
				...userWithoutImage,
				profileImage: user.profileImage || user.image || null,
			},
			notes,
			quizzes,
			mindMaps,
			analytics,
			explanations,
			interviewQuestionSets,
			quizSets,
			analogies,
			simulations,
			userTopics,
			documents,
			exportedAt: new Date().toISOString(),
		};
	}
}
