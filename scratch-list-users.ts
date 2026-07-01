import { prisma } from "./src/database";

async function main() {
  const [explanations, notes, generatedQuizzes, quizSets, interviewQuestions] = await Promise.all([
    prisma.explanation.findMany({ select: { id: true, userId: true } }),
    prisma.generatedNote.findMany({ select: { id: true, userId: true } }),
    prisma.generatedQuiz.findMany({ select: { id: true, userId: true } }),
    prisma.quizSet.findMany({ select: { id: true, userId: true } }),
    prisma.interviewQuestionSet.findMany({ select: { id: true, userId: true } }),
  ]);

  console.log("Explanations count:", explanations.length, explanations);
  console.log("Notes count:", notes.length, notes);
  console.log("GeneratedQuizzes count:", generatedQuizzes.length, generatedQuizzes);
  console.log("QuizSets count:", quizSets.length, quizSets);
  console.log("InterviewQuestions count:", interviewQuestions.length, interviewQuestions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
