import { prisma } from "../src/database";
import { runExplanationWorkflow } from "../src/modules/workflow/explanation/explanation.graph";
import { runAnalogyWorkflow } from "../src/modules/workflow/analogy/analogy.graph";
import { runInterviewQuestionsWorkflow } from "../src/modules/workflow/interview-questions/interviewQuestions.graph";
import { runQuizWorkflow } from "../src/modules/workflow/quiz/quiz.graph";
import { runNotesWorkflow } from "../src/modules/workflow/notes/notes.graph";
import { runMindMapWorkflow } from "../src/modules/workflow/mindmap/mindmap.graph";
import { runSimulationWorkflow } from "../src/modules/workflow/simulation/simulation.graph";
import { insightsApp } from "../src/modules/analytics/insights/insights.graph";
import { LearningHistoryService } from "../src/modules/learning-history/learningHistory.service";
import { MindMapService } from "../src/modules/workflow/mindmap/mindmap.service";

// Simple token estimator (~4 chars = 1 token) and exact length
function estimateTokens(text: string | object): number {
  const str = typeof text === "string" ? text : JSON.stringify(text);
  return Math.ceil(str.length / 3.8);
}

async function measureFeatureTokens() {
  const user = await prisma.user.findFirst();
  const doc = await prisma.document.findFirst();
  if (!user || !doc) return;

  const docId = doc.id;
  const userId = user.id;
  const sampleText = "Polymorphism allows objects of different classes to be treated as objects of a common superclass.";

  console.log("Measuring tokens per feature on real document...\n");

  const results: any = {};

  // 1. Explanation
  const expRes = await runExplanationWorkflow(docId, sampleText, userId);
  results["Explanation"] = {
    outputLengthChars: expRes.explanation?.length || 0,
    estimatedOutputTokens: estimateTokens(expRes.explanation || ""),
    estimatedTotalTokens: estimateTokens(expRes.context || "") + estimateTokens(expRes.explanation || "") + 400
  };

  // 2. Analogy
  const anaRes = await runAnalogyWorkflow(docId, sampleText, "creative", userId);
  results["Analogy"] = {
    outputLengthChars: JSON.stringify(anaRes.analogyData || {}).length,
    estimatedOutputTokens: estimateTokens(anaRes.analogyData || {}),
    estimatedTotalTokens: estimateTokens(anaRes.context || "") + estimateTokens(anaRes.analogyData || {}) + 400
  };

  // 3. Interview Questions
  const iqRes = await runInterviewQuestionsWorkflow(docId, sampleText, userId);
  results["Interview Questions"] = {
    outputLengthChars: JSON.stringify(iqRes.questions || {}).length,
    estimatedOutputTokens: estimateTokens(iqRes.questions || {}),
    estimatedTotalTokens: estimateTokens(iqRes.context || "") + estimateTokens(iqRes.questions || {}) + 400
  };

  // 4. Quiz
  const quizRes = await runQuizWorkflow(docId, sampleText, userId);
  results["Quiz"] = {
    outputLengthChars: JSON.stringify(quizRes.quiz || {}).length,
    estimatedOutputTokens: estimateTokens(quizRes.quiz || {}),
    estimatedTotalTokens: estimateTokens(quizRes.context || "") + estimateTokens(quizRes.quiz || {}) + 500
  };

  // 5. Notes
  const notesRes = await runNotesWorkflow(docId, sampleText, userId);
  results["Notes"] = {
    outputLengthChars: JSON.stringify(notesRes.notes || {}).length,
    estimatedOutputTokens: estimateTokens(notesRes.notes || {}),
    estimatedTotalTokens: estimateTokens(notesRes.context || "") + estimateTokens(notesRes.notes || {}) + 450
  };

  // 6. Mind Map
  const mmRes = await runMindMapWorkflow(docId, sampleText, userId);
  results["Mind Map"] = {
    outputLengthChars: JSON.stringify(mmRes.mindMapData || {}).length,
    estimatedOutputTokens: estimateTokens(mmRes.mindMapData || {}),
    estimatedTotalTokens: estimateTokens(mmRes.context || "") + estimateTokens(mmRes.mindMapData || {}) + 450
  };

  // 7. Simulation
  const simRes = await runSimulationWorkflow(docId, sampleText, userId, "concept", "medium");
  results["Simulation"] = {
    outputLengthChars: JSON.stringify(simRes.simulationData || {}).length,
    estimatedOutputTokens: estimateTokens(simRes.simulationData || {}),
    estimatedTotalTokens: estimateTokens(simRes.context || "") + estimateTokens(simRes.simulationData || {}) + 500
  };

  // 8. Insights
  const insRes = await insightsApp.invoke({
    userId,
    topics: null,
    featureUsage: null,
    consistency: null,
    productivity: null,
    revisions: null,
    insights: null,
    traceId: "measure-trace"
  });
  results["Analytics Insights"] = {
    outputLengthChars: JSON.stringify(insRes.insights || {}).length,
    estimatedOutputTokens: estimateTokens(insRes.insights || {}),
    estimatedTotalTokens: estimateTokens(insRes.insights || {}) + 800
  };

  // 9. Personalized Suggestions
  const lhService = new LearningHistoryService();
  const sugRes = await lhService.getPersonalizedSuggestions(userId);
  results["Personalized Suggestions"] = {
    outputLengthChars: JSON.stringify(sugRes || {}).length,
    estimatedOutputTokens: estimateTokens(sugRes || {}),
    estimatedTotalTokens: estimateTokens(sugRes || {}) + 600
  };

  console.log("=== TOKEN CONSUMPTION PER FEATURE ===");
  console.table(results);

  await prisma.$disconnect();
}

measureFeatureTokens();
