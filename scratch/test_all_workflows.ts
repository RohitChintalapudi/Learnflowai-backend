import { runExplanationWorkflow } from "../src/modules/workflow/explanation/explanation.graph";
import { runAnalogyWorkflow } from "../src/modules/workflow/analogy/analogy.graph";
import { runInterviewQuestionsWorkflow } from "../src/modules/workflow/interview-questions/interviewQuestions.graph";
import { runQuizWorkflow } from "../src/modules/workflow/quiz/quiz.graph";
import { runNotesWorkflow } from "../src/modules/workflow/notes/notes.graph";
import { runMindMapWorkflow } from "../src/modules/workflow/mindmap/mindmap.graph";
import { runSimulationWorkflow } from "../src/modules/workflow/simulation/simulation.graph";
import { insightsApp } from "../src/modules/analytics/insights/insights.graph";
import { LearningHistoryService } from "../src/modules/learning-history/learningHistory.service";
import { prisma } from "../src/database";

async function testAll() {
  const user = await prisma.user.findFirst();
  const doc = await prisma.document.findFirst();
  if (!user || !doc) {
    console.error("Missing test user or doc");
    return;
  }

  const docId = doc.id;
  const userId = user.id;
  const highlightedText = "Polymorphism allows objects of different classes to be treated as objects of a common superclass.";

  console.log(`Testing with User ${userId}, Doc ${docId}`);

  console.log("\n1. Testing Explanation Workflow...");
  try {
    const res = await runExplanationWorkflow(docId, highlightedText, userId);
    console.log("✓ Explanation SUCCESS:", res.explanation?.slice(0, 100) + "...");
  } catch (err: any) {
    console.error("✗ Explanation FAILED:", err?.message || err);
  }

  console.log("\n2. Testing Analogy Workflow...");
  try {
    const res = await runAnalogyWorkflow(docId, highlightedText, "creative", userId);
    console.log("✓ Analogy SUCCESS:", res.analogyData ? "Valid analogy data" : "No data");
  } catch (err: any) {
    console.error("✗ Analogy FAILED:", err?.message || err);
  }

  console.log("\n3. Testing Interview Questions Workflow...");
  try {
    const res = await runInterviewQuestionsWorkflow(docId, highlightedText, userId);
    console.log("✓ Interview Questions SUCCESS:", {
      basic: res.questions?.basic?.length,
      intermediate: res.questions?.intermediate?.length,
      advanced: res.questions?.advanced?.length
    });
  } catch (err: any) {
    console.error("✗ Interview Questions FAILED:", err?.message || err);
  }

  console.log("\n4. Testing Quiz Workflow...");
  try {
    const res = await runQuizWorkflow(docId, highlightedText, userId);
    console.log("✓ Quiz SUCCESS:", {
      mcqs: res.quiz?.mcqs?.length,
      trueFalse: res.quiz?.trueFalse?.length,
      shortAnswer: res.quiz?.shortAnswer?.length
    });
  } catch (err: any) {
    console.error("✗ Quiz FAILED:", err?.message || err);
  }

  console.log("\n5. Testing Notes Workflow...");
  try {
    const res = await runNotesWorkflow(docId, highlightedText, userId);
    console.log("✓ Notes SUCCESS:", res.notes ? "Generated notes" : "No notes");
  } catch (err: any) {
    console.error("✗ Notes FAILED:", err?.message || err);
  }

  console.log("\n6. Testing Mind Map Workflow...");
  try {
    const res = await runMindMapWorkflow(docId, highlightedText, userId);
    console.log("✓ Mind Map SUCCESS:", res.mindMapData ? "Generated mind map" : "No mind map");
  } catch (err: any) {
    console.error("✗ Mind Map FAILED:", err?.message || err);
  }

  console.log("\n7. Testing Simulation Workflow...");
  try {
    const res = await runSimulationWorkflow(docId, highlightedText, userId, "concept", "medium");
    console.log("✓ Simulation SUCCESS:", res.simulationData ? "Generated simulation" : "No simulation");
  } catch (err: any) {
    console.error("✗ Simulation FAILED:", err?.message || err);
  }

  console.log("\n8. Testing Insights Workflow...");
  try {
    const res = await insightsApp.invoke({
      userId,
      topics: null,
      featureUsage: null,
      consistency: null,
      productivity: null,
      revisions: null,
      insights: null,
      traceId: "test-trace"
    });
    console.log("✓ Insights SUCCESS:", res.insights ? "Generated insights" : "No insights");
  } catch (err: any) {
    console.error("✗ Insights FAILED:", err?.message || err);
  }

  console.log("\n9. Testing Personalized Suggestions...");
  try {
    const service = new LearningHistoryService();
    const suggestions = await service.getPersonalizedSuggestions(userId);
    console.log("✓ Suggestions SUCCESS:", suggestions.length, "suggestions");
  } catch (err: any) {
    console.error("✗ Suggestions FAILED:", err?.message || err);
  }

  await prisma.$disconnect();
}

testAll();
