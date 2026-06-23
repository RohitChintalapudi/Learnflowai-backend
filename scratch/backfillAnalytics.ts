import { prisma } from "../src/database/prisma";
import { AnalyticsEventType } from "../src/modules/analytics/analytics.tracker";

async function main() {
  console.log("Starting backfill of analytics events...");
  
  // 1. Documents
  const documents = await prisma.document.findMany({ where: { uploadedBy: { not: null } } });
  for (const doc of documents) {
    if (!doc.uploadedBy) continue;
    await prisma.analyticsEvent.create({
      data: {
        userId: doc.uploadedBy,
        eventType: AnalyticsEventType.DOCUMENT_UPLOADED,
        createdAt: doc.createdAt,
        metadata: { documentId: doc.id }
      }
    });
  }
  console.log(`Backfilled ${documents.length} document uploads.`);

  // 2. Explanations
  const explanations = await prisma.explanation.findMany();
  for (const exp of explanations) {
    await prisma.analyticsEvent.create({
      data: {
        userId: exp.userId,
        eventType: AnalyticsEventType.AI_EXPLANATION_GENERATED,
        createdAt: exp.createdAt,
        metadata: { explanationId: exp.id, documentId: exp.documentId }
      }
    });
  }
  console.log(`Backfilled ${explanations.length} explanations.`);

  // 3. Notes
  const notes = await prisma.generatedNote.findMany();
  for (const note of notes) {
    await prisma.analyticsEvent.create({
      data: {
        userId: note.userId,
        eventType: AnalyticsEventType.AI_NOTES_GENERATED,
        createdAt: note.createdAt,
        metadata: { noteId: note.id, documentId: note.documentId }
      }
    });
  }
  console.log(`Backfilled ${notes.length} notes.`);

  // 4. Quizzes
  const quizzes = await prisma.generatedQuiz.findMany();
  for (const quiz of quizzes) {
    await prisma.analyticsEvent.create({
      data: {
        userId: quiz.userId,
        eventType: AnalyticsEventType.AI_QUIZ_GENERATED,
        createdAt: quiz.createdAt,
        metadata: { quizId: quiz.id, documentId: quiz.documentId }
      }
    });
  }
  console.log(`Backfilled ${quizzes.length} quizzes.`);

  // 5. Interview Questions
  const interviewSets = await prisma.interviewQuestionSet.findMany();
  for (const set of interviewSets) {
    await prisma.analyticsEvent.create({
      data: {
        userId: set.userId,
        eventType: AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED,
        createdAt: set.createdAt,
        metadata: { setId: set.id, documentId: set.documentId }
      }
    });
  }
  console.log(`Backfilled ${interviewSets.length} interview questions.`);

  // 6. Mind Maps
  const mindmaps = await prisma.generatedMindMap.findMany();
  for (const mm of mindmaps) {
    await prisma.analyticsEvent.create({
      data: {
        userId: mm.userId,
        eventType: AnalyticsEventType.AI_MINDMAP_GENERATED,
        createdAt: mm.createdAt,
        metadata: { mindmapId: mm.id, documentId: mm.documentId }
      }
    });
  }
  console.log(`Backfilled ${mindmaps.length} mind maps.`);

  // 7. Analogies
  const analogies = await prisma.generatedAnalogy.findMany();
  for (const an of analogies) {
    await prisma.analyticsEvent.create({
      data: {
        userId: an.userId,
        eventType: AnalyticsEventType.AI_ANALOGY_GENERATED,
        createdAt: an.createdAt,
        metadata: { analogyId: an.id, documentId: an.documentId }
      }
    });
  }
  console.log(`Backfilled ${analogies.length} analogies.`);

  console.log("Analytics backfill complete!");
  process.exit(0);
}

main().catch(console.error);
