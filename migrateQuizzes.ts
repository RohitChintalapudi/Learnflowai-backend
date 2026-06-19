import { prisma } from './src/database/prisma';

async function migrateQuizzes() {
  console.log("Starting migration of QuizSet to GeneratedQuiz...");

  // Get all existing QuizSets with their document titles
  const oldQuizzes = await prisma.quizSet.findMany({
    include: {
      document: {
        select: {
          title: true
        }
      }
    }
  });

  console.log(`Found ${oldQuizzes.length} quizzes in QuizSet table.`);

  let migratedCount = 0;

  for (const quiz of oldQuizzes) {
    // Check if we already migrated this specific quiz (to prevent duplicates if run multiple times)
    // We can use a combination of userId, documentId, and highlightedText
    const existing = await prisma.generatedQuiz.findFirst({
      where: {
        userId: quiz.userId,
        documentId: quiz.documentId,
        highlightedText: quiz.highlightedText,
        createdAt: quiz.createdAt
      }
    });

    if (!existing) {
      const quizJson = quiz.quizJson as any;
      const mcqsLength = quizJson?.mcqs?.length || 0;
      const tfLength = quizJson?.trueFalse?.length || 0;
      const saLength = quizJson?.shortAnswer?.length || 0;
      const totalQuestions = mcqsLength + tfLength + saLength;

      await prisma.generatedQuiz.create({
        data: {
          userId: quiz.userId,
          documentId: quiz.documentId,
          title: quiz.document.title || "Untitled Document",
          highlightedText: quiz.highlightedText,
          quizData: quiz.quizJson,
          totalQuestions: totalQuestions > 0 ? totalQuestions : quiz.totalQuestions,
          createdAt: quiz.createdAt
        }
      });
      migratedCount++;
    }
  }

  console.log(`Successfully migrated ${migratedCount} quizzes to GeneratedQuiz.`);
}

migrateQuizzes()
  .catch(console.error)
  .finally(() => prisma['$disconnect']());
