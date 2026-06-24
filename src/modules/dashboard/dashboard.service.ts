import { prisma } from "../../database";

export class DashboardService {
	async getDashboardSummary(userId: string) {
		const [user, documentsCount, explanationsCount, notesCount, quizzesCount] = await Promise.all([
			prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
			prisma.document.count({ where: { uploadedBy: userId } }),
			prisma.explanation.count({ where: { userId } }),
			prisma.generatedNote.count({ where: { userId } }),
			prisma.generatedQuiz.count({ where: { userId } }),
		]);

		const recentDocuments = await prisma.document.findMany({
			where: { uploadedBy: userId },
			orderBy: { createdAt: "desc" },
			take: 4,
			select: {
				id: true,
				title: true,
				fileName: true,
				fileType: true,
				totalPages: true,
				createdAt: true,
			},
		});

		// Fetch recent items for activity feed
		const [recentExplanations, recentNotes, recentQuizzes] = await Promise.all([
			prisma.explanation.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 5,
				include: { document: { select: { title: true } } },
			}),
			prisma.generatedNote.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 5,
				include: { document: { select: { title: true } } },
			}),
			prisma.generatedQuiz.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 5,
				include: { document: { select: { title: true } } },
			}),
		]);

		// Format activities
		const activities: any[] = [];

		recentDocuments.forEach((doc: any) => {
			activities.push({
				action: "Uploaded",
				target: doc.fileName || doc.title,
				time: doc.createdAt,
				type: "Document",
				id: doc.id,
			});
		});

		recentExplanations.forEach((exp: any) => {
			activities.push({
				action: "Asked AI",
				target:
					exp.highlightedText.substring(0, 30) + (exp.highlightedText.length > 30 ? "..." : ""),
				time: exp.createdAt,
				type: "Explanation",
				id: exp.id,
				documentTitle: exp.document?.title,
			});
		});

		recentNotes.forEach((note: any) => {
			activities.push({
				action: "Generated Notes",
				target: note.title || (note.document?.title ? `for ${note.document.title}` : "Document"),
				time: note.createdAt,
				type: "Notes",
				id: note.id,
			});
		});

		recentQuizzes.forEach((quiz: any) => {
			activities.push({
				action: "Created Quiz",
				target: quiz.document?.title ? `for ${quiz.document.title}` : "Document",
				time: quiz.createdAt,
				type: "Quiz",
				id: quiz.id,
			});
		});

		// Sort by time descending and take top 10
		activities.sort((a, b) => b.time.getTime() - a.time.getTime());
		const recentActivity = activities.slice(0, 10);

		return {
			user: {
				name: user?.name || "User",
			},
			stats: {
				documentsCount,
				explanationsCount,
				notesCount,
				quizzesCount,
				learningStreak: 1, // Mocked for now since tracking consecutive days needs a more complex query
			},
			recentDocuments,
			recentActivity,
		};
	}
}
