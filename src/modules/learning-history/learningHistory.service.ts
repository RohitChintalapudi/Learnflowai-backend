import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { prisma } from "../../database";
import { getGroqClient } from "../../lib/ai/groq";
import { SUGGESTIONS_SYSTEM_PROMPT, SUGGESTIONS_USER_PROMPT } from "./learningHistory.prompts";

export class LearningHistoryService {
  async getLearningHistory(userId: string, limit: number = 50) {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return [];
    }

    const [explanations, notes, generatedQuizzes, quizSets, interviewQuestions, simulations] = await Promise.all([
      prisma.explanation.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.generatedNote.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.generatedQuiz.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.quizSet.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.interviewQuestionSet.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.generatedSimulation.findMany({
        where: { userId },
        include: { document: { select: { title: true } } },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const timeline: any[] = [];

    explanations.forEach((e: any) => timeline.push({ ...e, activityType: "Explanation" }));
    notes.forEach((n: any) => timeline.push({ ...n, activityType: "GeneratedNote" }));
    generatedQuizzes.forEach((q: any) => timeline.push({ ...q, activityType: "GeneratedQuiz" }));
    quizSets.forEach((q: any) => timeline.push({ ...q, activityType: "QuizSet" }));
    interviewQuestions.forEach((i: any) => timeline.push({ ...i, activityType: "InterviewQuestionSet" }));
    simulations.forEach((s: any) => timeline.push({ ...s, activityType: "GeneratedSimulation" }));

    // Sort descending by created time
    timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return timeline.slice(0, limit);
  }

  async getPersonalizedSuggestions(userId: string) {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return [];
    }

    // 1. Fetch recent history for context (only need top 15)
    const recentHistory = await this.getLearningHistory(userId, 15);
    if (!recentHistory || recentHistory.length === 0) {
      return [];
    }
    const topHistory = recentHistory; // limit context

    const historyContextList = topHistory
      .map((item) => {
        if (item.activityType === "Explanation") return `Asked about: ${item.highlightedText}`;
        if (item.activityType === "GeneratedNote") return `Generated notes on: ${item.title || item.highlightedText}`;
        if (item.activityType === "QuizSet") return `Took quiz for document: ${item.document?.title}, Score: ${item.score}/${item.totalQuestions}`;
        if (item.activityType === "InterviewQuestionSet") return `Generated interview questions on: ${item.highlightedText}`;
        if (item.activityType === "GeneratedSimulation") return `Generated simulation on: ${item.highlightedText} (${item.simulationType})`;
        return null;
      })
      .filter(Boolean)
      .join("\n");

    const topicsToImproveList = topHistory
      .filter((item) => item.activityType === "QuizSet" && item.topicsToImprove)
      .flatMap((item) => item.topicsToImprove as string[])
      .filter(Boolean);

    // Deduplicate topics to improve
    const uniqueTopicsToImprove = Array.from(new Set(topicsToImproveList)).join(", ");

    // 2. Build prompt
    const userPrompt = SUGGESTIONS_USER_PROMPT
      .replace("{history}", historyContextList || "No recent history available.")
      .replace("{topicsToImprove}", uniqueTopicsToImprove || "No specific topics identified from quizzes.");

    // 3. Call AI
    const groqClient = getGroqClient();

    try {
      const response = await groqClient.invoke(
        [
          new SystemMessage(SUGGESTIONS_SYSTEM_PROMPT),
          new HumanMessage(userPrompt),
        ],
        {
          response_format: { type: "json_object" },
        }
      );

      const parsed = JSON.parse(response.content as string);
      return parsed.suggestions || [];
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return [];
    }
  }
}
