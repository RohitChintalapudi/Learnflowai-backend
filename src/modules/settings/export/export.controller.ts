import type { Request, Response } from "express";
import { ExportService } from "./export.service";
// @ts-ignore
const { ZipArchive } = require("archiver");

export class ExportController {
	private exportService: ExportService;

	constructor() {
		this.exportService = new ExportService();
	}

	public exportData = async (req: Request, res: Response): Promise<void> => {
		console.log("Export started for user:", req.user?.id);
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const data = await this.exportService.exportUserData(user.id);

			console.log("ZIP generation started.");
			res.setHeader("Content-Type", "application/zip");
			res.setHeader("Content-Disposition", 'attachment; filename="learnflow-data.zip"');

			const archive = new ZipArchive({
				zlib: { level: 9 },
			});

			archive.on("error", (err: any) => {
				throw err;
			});

			archive.pipe(res);

			const { generatePdfBuffer } = require("./pdfGenerator");
			
			archive.append(await generatePdfBuffer("Profile", data.profile), { name: "Profile.pdf" });
			archive.append(await generatePdfBuffer("Documents", data.documents), { name: "Documents.pdf" });
			archive.append(await generatePdfBuffer("Notes", data.notes), { name: "Notes.pdf" });
			archive.append(await generatePdfBuffer("Quizzes", data.quizzes), { name: "Quizzes.pdf" });
			archive.append(await generatePdfBuffer("Interview Questions", data.interviewQuestionSets), { name: "Interview Questions.pdf" });
			archive.append(await generatePdfBuffer("Mind Maps", data.mindMaps), { name: "Mind Maps.pdf" });
			archive.append(await generatePdfBuffer("Analogies", data.analogies), { name: "Analogies.pdf" });
			archive.append(await generatePdfBuffer("Simulations", data.simulations), { name: "Simulations.pdf" });
			archive.append(await generatePdfBuffer("Learning History", data.userTopics), { name: "Learning History.pdf" });
			archive.append(await generatePdfBuffer("Analytics", data.analytics), { name: "Analytics.pdf" });

			await archive.finalize();
			console.log("ZIP generation finished.");
		} catch (error: any) {
			console.error("Error in exportData:", error);
			if (!res.headersSent) {
				res.status(500).json({
					success: false,
					message: "Internal server error",
				});
			}
		}
	};
}
