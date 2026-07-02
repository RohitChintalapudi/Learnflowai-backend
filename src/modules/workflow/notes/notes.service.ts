import type { Prisma } from "@prisma/client";
import { prisma } from "../../../database";
import { AnalyticsEventType, AnalyticsTracker } from "../../analytics/analytics.tracker";
import { runNotesWorkflow } from "./notes.graph";
import type { GeneratedNotes, NotesResponse } from "./notes.types";

export class NotesService {
	public async generateNotes(
		documentId: string,
		highlightedText: string,
		userId: string,
	): Promise<NotesResponse> {
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

			// Check if a note already exists for this text & document & user (Query Caching)
			const existingNote = await prisma.generatedNote.findFirst({
				where: {
					userId,
					documentId,
					highlightedText: {
						equals: highlightedText.trim(),
						mode: "insensitive",
					},
				},
			});

			if (existingNote) {
				return {
					success: true,
					notes: existingNote.notes as unknown as GeneratedNotes,
					retrievedChunks: 0,
					noteId: existingNote.id,
				};
			}

			// 2. Run LangGraph workflow
			const result = await runNotesWorkflow(documentId, highlightedText, userId);

			console.log(`AI Notes workflow completed in ${Date.now() - startTime}ms`);

			if (!result.notes) {
				return { success: false, message: "Parsing failure: Unable to generate structured notes." };
			}

			// 3. Save generated notes to DB
			const generatedNote = await prisma.generatedNote.create({
				data: {
					userId,
					documentId,
					highlightedText,
					title: result.notes.title,
					notes: result.notes as unknown as Prisma.InputJsonValue,
				},
			});

			// 4. Create In-App Alert
			await prisma.alert.create({
				data: {
					userId,
					title: "Notes generated",
					message: `Revision notes "${result.notes.title || "Notes"}" generated successfully for "${document.title}".`,
					type: "success",
				},
			});

			// 5. Analytics Event
			await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_NOTES_GENERATED, {
				documentId,
			});

			if (result.notes) {
				const mainTopic = result.notes.title;
				const relatedConcepts = (result.notes.relatedConcepts || []).map((c: string) => {
					const colonIdx = c.indexOf(":");
					if (colonIdx !== -1) {
						return c.substring(0, colonIdx).trim();
					}
					return c.trim();
				});

				await AnalyticsTracker.trackTopics(userId, [mainTopic, ...relatedConcepts]);
			}

			return {
				success: true,
				notes: result.notes,
				retrievedChunks: result.retrievedChunks.length,
				noteId: generatedNote.id,
			};
		} catch (error: unknown) {
			console.error("Error generating notes:", error);
			const errorMessage =
				error instanceof Error ? error.message : "An error occurred while generating the notes";
			return {
				success: false,
				message: errorMessage,
			};
		}
	}

	public async deleteNote(
		noteId: string,
		userId: string,
	): Promise<{ success: boolean; message?: string }> {
		try {
			const note = await prisma.generatedNote.findUnique({
				where: { id: noteId },
				select: { userId: true },
			});

			if (!note) {
				return { success: false, message: "Note not found" };
			}

			if (note.userId !== userId) {
				return { success: false, message: "Unauthorized to delete this note" };
			}

			await prisma.generatedNote.delete({
				where: { id: noteId },
			});

			return { success: true };
		} catch (error: unknown) {
			console.error("Error deleting note:", error);
			return { success: false, message: "An error occurred while deleting the note" };
		}
	}

	public async getNotes(userId: string) {
		try {
			const notes = await prisma.generatedNote.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
			return { success: true, notes };
		} catch (error: unknown) {
			console.error("Error fetching notes:", error);
			return { success: false, message: "An error occurred while fetching notes" };
		}
	}
}
