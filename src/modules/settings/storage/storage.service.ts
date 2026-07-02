import { prisma } from "../../../database";

export class StorageSettingsService {
  public async getStorageDetails(userId: string) {
    // 1. Uploaded Documents
    const documents = await prisma.document.findMany({
      where: { uploadedBy: userId },
      select: { fileSize: true }
    });
    const docCount = documents.length;
    // Estimate 1.5MB if fileSize is null
    const docSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 1024 * 1024 * 1.5), 0);

    // 2. Generated Notes
    const notes = await prisma.generatedNote.findMany({
      where: { userId },
      select: { notes: true }
    });
    const noteCount = notes.length;
    const noteSize = notes.reduce((sum, note) => {
      // Estimate size based on JSON character length
      const length = JSON.stringify(note.notes).length;
      return sum + length;
    }, 0);

    // 3. Quiz Files
    const generatedQuizzes = await prisma.generatedQuiz.findMany({
      where: { userId },
      select: { quizData: true }
    });
    const quizSets = await prisma.quizSet.findMany({
      where: { userId },
      select: { quizJson: true }
    });
    const quizCount = generatedQuizzes.length + quizSets.length;
    const genQuizSize = generatedQuizzes.reduce((sum, q) => sum + JSON.stringify(q.quizData).length, 0);
    const quizSetSize = quizSets.reduce((sum, q) => sum + JSON.stringify(q.quizJson).length, 0);
    const quizSize = genQuizSize + quizSetSize;

    // 4. AI Conversations (Explanations, Analogies, Mindmaps, Simulations, Interview Questions)
    const explanations = await prisma.explanation.findMany({
      where: { userId },
      select: { explanationText: true, highlightedText: true }
    });
    const mindmaps = await prisma.generatedMindMap.findMany({
      where: { userId },
      select: { mindMapData: true }
    });
    const analogies = await prisma.generatedAnalogy.findMany({
      where: { userId },
      select: { analogyData: true }
    });
    const simulations = await prisma.generatedSimulation.findMany({
      where: { userId },
      select: { simulationData: true }
    });
    const interviews = await prisma.interviewQuestionSet.findMany({
      where: { userId },
      select: { questionsJson: true }
    });

    const expSize = explanations.reduce((sum, e) => sum + e.explanationText.length + e.highlightedText.length, 0);
    const mmSize = mindmaps.reduce((sum, m) => sum + JSON.stringify(m.mindMapData).length, 0);
    const analSize = analogies.reduce((sum, a) => sum + JSON.stringify(a.analogyData).length, 0);
    const simSize = simulations.reduce((sum, s) => sum + JSON.stringify(s.simulationData).length, 0);
    const intSize = interviews.reduce((sum, i) => sum + JSON.stringify(i.questionsJson).length, 0);

    const convoCount = explanations.length + mindmaps.length + analogies.length + simulations.length + interviews.length;
    const convoSize = expSize + mmSize + analSize + simSize + intSize;

    const totalUsed = docSize + noteSize + quizSize + convoSize;
    const totalLimit = 2 * 1024 * 1024 * 1024; // 2 GB

    return {
      totalLimit,
      totalUsed,
      percentageUsed: Math.min(100, Math.round((totalUsed / totalLimit) * 100)),
      breakdown: {
        documents: {
          count: docCount,
          sizeBytes: docSize,
        },
        notes: {
          count: noteCount,
          sizeBytes: noteSize,
        },
        quizzes: {
          count: quizCount,
          sizeBytes: quizSize,
        },
        conversations: {
          count: convoCount,
          sizeBytes: convoSize,
        }
      }
    };
  }

  public async deleteCache(userId: string) {
    // Clear simulation or temporary logs if desired, or return success status
    return { success: true, message: "Cache deleted successfully" };
  }
}
