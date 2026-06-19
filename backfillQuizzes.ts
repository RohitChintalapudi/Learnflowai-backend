import { prisma } from './src/database/prisma';

async function backfillQuizzes() {
  const quizzes = await prisma.quizSet.findMany({
    where: {
      status: "PENDING",
      score: null,
    }
  });

  console.log(`Found ${quizzes.length} pending quizzes to backfill.`);

  for (const quiz of quizzes) {
    const quizJson = quiz.quizJson as any;
    const mcqsLength = quizJson?.mcqs?.length || 0;
    const tfLength = quizJson?.trueFalse?.length || 0;
    const totalQuestions = mcqsLength + tfLength;

    if (totalQuestions > 0) {
      // Assuming they got perfect score since we didn't track answers back then
      await prisma.quizSet.update({
        where: { id: quiz.id },
        data: {
          status: "COMPLETED",
          score: totalQuestions,
          totalQuestions,
          topicsToImprove: [],
        }
      });
      console.log(`Updated quiz ${quiz.id} to COMPLETED with score ${totalQuestions}/${totalQuestions}`);
    }
  }

  console.log("Backfill complete.");
}

backfillQuizzes().catch(console.error).finally(() => prisma.$disconnect());
