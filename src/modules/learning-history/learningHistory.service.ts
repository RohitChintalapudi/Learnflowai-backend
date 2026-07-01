import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { prisma } from "../../database";
import { getGroqClient } from "../../lib/ai/groq";
import { SUGGESTIONS_SYSTEM_PROMPT, SUGGESTIONS_USER_PROMPT } from "./learningHistory.prompts";

export class LearningHistoryService {
  async getLearningHistory(
    userId: string, 
    limit: number = 50, 
    options: {
      search?: string;
      feature?: string;
      dateRange?: string;
      sort?: string;
    } = {}
  ) {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return [];
    }

    const { search, feature, dateRange, sort } = options;

    // Build common where conditions
    const baseWhere: any = { userId };

    // Apply date range filter
    if (dateRange && dateRange !== "All Time") {
      const now = new Date();
      if (dateRange === "Today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        baseWhere.createdAt = { gte: start };
      } else if (dateRange === "7 Days") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        baseWhere.createdAt = { gte: start };
      } else if (dateRange === "30 Days") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        baseWhere.createdAt = { gte: start };
      }
    }

    // Prepare search filters for Prisma
    const getSearchFilter = (hasTitle: boolean = false) => {
      if (!search || search.trim() === "") return {};
      const trimmedSearch = search.trim();
      const conditions: any[] = [
        { document: { title: { contains: trimmedSearch, mode: "insensitive" } } },
        { highlightedText: { contains: trimmedSearch, mode: "insensitive" } }
      ];
      if (hasTitle) {
        conditions.push({ title: { contains: trimmedSearch, mode: "insensitive" } });
      }
      return { OR: conditions };
    };

    // Determine which features to fetch
    const fetchExplanation = !feature || feature === "All" || feature === "Explanation";
    const fetchNotes = !feature || feature === "All" || feature === "Notes";
    const fetchQuiz = !feature || feature === "All" || feature === "Quiz";
    const fetchInterview = !feature || feature === "All" || feature === "Interview";
    const fetchMindMap = !feature || feature === "All" || feature === "Mind Map";
    const fetchAnalogy = !feature || feature === "All" || feature === "Analogy";
    const fetchSimulation = !feature || feature === "All" || feature === "Simulation";

    const fetchPromises: Promise<any[]>[] = [];

    if (fetchExplanation) {
      fetchPromises.push(
        prisma.explanation.findMany({
          where: { ...baseWhere, ...getSearchFilter() },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "Explanation" })))
      );
    }

    if (fetchNotes) {
      fetchPromises.push(
        prisma.generatedNote.findMany({
          where: { ...baseWhere, ...getSearchFilter(true) },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "GeneratedNote" })))
      );
    }

    if (fetchQuiz) {
      fetchPromises.push(
        prisma.generatedQuiz.findMany({
          where: { ...baseWhere, ...getSearchFilter(true) },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "GeneratedQuiz" })))
      );
      fetchPromises.push(
        prisma.quizSet.findMany({
          where: { ...baseWhere, ...getSearchFilter() },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "QuizSet" })))
      );
    }

    if (fetchInterview) {
      fetchPromises.push(
        prisma.interviewQuestionSet.findMany({
          where: { ...baseWhere, ...getSearchFilter() },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "InterviewQuestionSet" })))
      );
    }

    if (fetchMindMap) {
      fetchPromises.push(
        prisma.generatedMindMap.findMany({
          where: { ...baseWhere, ...getSearchFilter(true) },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "GeneratedMindMap" })))
      );
    }

    if (fetchAnalogy) {
      fetchPromises.push(
        prisma.generatedAnalogy.findMany({
          where: { ...baseWhere, ...getSearchFilter(true) },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "GeneratedAnalogy" })))
      );
    }

    if (fetchSimulation) {
      fetchPromises.push(
        prisma.generatedSimulation.findMany({
          where: { ...baseWhere, ...getSearchFilter() },
          include: { document: { select: { title: true } } },
          take: limit,
          orderBy: { createdAt: sort === "Oldest" ? "asc" : "desc" },
        }).then(items => items.map(item => ({ ...item, activityType: "GeneratedSimulation" })))
      );
    }

    const results = await Promise.all(fetchPromises);
    const timeline = results.flat();

    // Sort descending or ascending by created time
    timeline.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sort === "Oldest" ? timeA - timeB : timeB - timeA;
    });

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
