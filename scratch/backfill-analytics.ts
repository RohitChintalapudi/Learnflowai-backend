import { prisma } from "../src/database/prisma";
import { AnalyticsEventType } from "../src/modules/analytics/analytics.tracker";

async function backfill() {
  console.log("Starting backfill process for AnalyticsEvent...");

  // 1. Documents
  const docs = await prisma.document.findMany();
  for (const doc of docs) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: doc.uploadedBy, eventType: AnalyticsEventType.DOCUMENT_UPLOADED, createdAt: doc.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: doc.uploadedBy,
          eventType: AnalyticsEventType.DOCUMENT_UPLOADED,
          createdAt: doc.createdAt,
          metadata: { documentId: doc.id }
        }
      });
    }
  }
  console.log(`Processed ${docs.length} Documents`);

  // 2. Notes
  const notes = await prisma.generatedNote.findMany();
  for (const item of notes) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_NOTES_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_NOTES_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${notes.length} Notes`);

  // 3. Quizzes
  const quizzes = await prisma.generatedQuiz.findMany();
  for (const item of quizzes) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_QUIZ_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_QUIZ_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${quizzes.length} Quizzes`);

  // 4. Explanations
  const explanations = await prisma.explanation.findMany();
  for (const item of explanations) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_EXPLANATION_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_EXPLANATION_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${explanations.length} Explanations`);

  // 5. Interview Questions
  const interviews = await prisma.interviewQuestionSet.findMany();
  for (const item of interviews) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${interviews.length} Interview Questions`);

  // 6. Mind Maps
  const mindmaps = await prisma.generatedMindMap.findMany();
  for (const item of mindmaps) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_MINDMAP_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_MINDMAP_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${mindmaps.length} Mind Maps`);

  // 7. Analogies
  const analogies = await prisma.generatedAnalogy.findMany();
  for (const item of analogies) {
    const exists = await prisma.analyticsEvent.findFirst({
      where: { userId: item.userId, eventType: AnalyticsEventType.AI_ANALOGY_GENERATED, createdAt: item.createdAt }
    });
    if (!exists) {
      await prisma.analyticsEvent.create({
        data: {
          userId: item.userId,
          eventType: AnalyticsEventType.AI_ANALOGY_GENERATED,
          createdAt: item.createdAt,
          metadata: { documentId: item.documentId }
        }
      });
    }
  }
  console.log(`Processed ${analogies.length} Analogies`);

  console.log("Backfill complete!");
  process.exit(0);
}

backfill().catch(e => {
  console.error(e);
  process.exit(1);
});
