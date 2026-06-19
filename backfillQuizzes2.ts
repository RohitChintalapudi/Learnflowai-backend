import { prisma } from './src/database/prisma';

async function backfillNewPendingQuizzes() {
  const quizzes = await prisma.quizSet.findMany({
    where: {
      status: "PENDING",
      score: null,
    }
  });

  for (const quiz of quizzes) {
    const quizJson = quiz.quizJson as any;
    const mcqsLength = quizJson?.mcqs?.length || 0;
    const tfLength = quizJson?.trueFalse?.length || 0;
    const totalQuestions = mcqsLength + tfLength;

    if (totalQuestions > 0) {
      await prisma.quizSet.update({
        where: { id: quiz.id },
        data: {
          status: "COMPLETED",
          score: totalQuestions,
          totalQuestions,
          topicsToImprove: [],
        }
      });
      console.log(`Updated pending quiz ${quiz.id} to COMPLETED.`);
    }
  }
}

backfillNewPendingQuizzes().catch(console.error).finally(() => prisma['$disconnect']());
