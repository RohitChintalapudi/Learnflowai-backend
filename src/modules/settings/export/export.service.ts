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
			prisma.generatedNote.findMany({ where: { userId } }),
			prisma.generatedQuiz.findMany({ where: { userId } }),
			prisma.generatedMindMap.findMany({ where: { userId } }),
			prisma.analyticsEvent.findMany({ where: { userId } }),
			prisma.explanation.findMany({ where: { userId } }),
			prisma.interviewQuestionSet.findMany({ where: { userId } }),
			prisma.quizSet.findMany({ where: { userId } }),
			prisma.generatedAnalogy.findMany({ where: { userId } }),
			prisma.generatedSimulation.findMany({ where: { userId } }),
			prisma.userTopic.findMany({ where: { userId } }),
			prisma.document.findMany({ where: { uploadedBy: userId } }),
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
