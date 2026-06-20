import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";
import { prisma } from "../../../database";
import { runNotesWorkflow } from "./notes.graph";
import { NotesResponse } from "./notes.types";

export class NotesService {
  public async generateNotes(
    documentId: string,
    highlightedText: string,
    userId: string
  ): Promise<NotesResponse> {
    try {
      const startTime = Date.now();

      // 1. Verify document exists and check ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, uploadedBy: true },
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
      const result = await runNotesWorkflow(documentId, highlightedText, userId);

      const workflowTime = Date.now() - startTime;

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
          notes: result.notes as any, // Store as JSON
        }
      });

      // 4. Analytics Event
      await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.AI_NOTES_GENERATED, { documentId });
      
      if (result?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          result.mainTopic, 
          ...(result.relatedConcepts || [])
        ]);
      }

      return {
        success: true,
        notes: result.notes,
        retrievedChunks: result.retrievedChunks.length,
        noteId: generatedNote.id,
      };
    } catch (error: any) {
      console.error("Error generating notes:", error);
      return {
        success: false,
        message: error?.message || "An error occurred while generating the notes",
      };
    }
  }

  public async deleteNote(noteId: string, userId: string): Promise<{ success: boolean; message?: string }> {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      return { success: false, message: "An error occurred while fetching notes" };
    }
  }
}
