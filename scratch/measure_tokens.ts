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
import { env } from "../src/config/env";

async function measureLimitsAndTokens() {
  console.log("=== 1. CHECKING GROQ MODEL LIMITS FROM HEADERS ===");
  const models = [
    'groq/compound-mini',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b'
  ];

  for (const m of models) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: m,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5
      })
    });
    console.log(`\nModel: ${m}`);
    console.log("Status:", res.status);
    console.log("RPM (Requests/Min):", res.headers.get("x-ratelimit-limit-requests"));
    console.log("RPD (Requests/Day):", res.headers.get("x-ratelimit-limit-requests-per-day") || res.headers.get("x-ratelimit-limit-rpd"));
    console.log("TPM (Tokens/Min):", res.headers.get("x-ratelimit-limit-tokens"));
    console.log("TPD (Tokens/Day):", res.headers.get("x-ratelimit-limit-tokens-per-day") || res.headers.get("x-ratelimit-limit-tpd"));
  }

  await prisma.$disconnect();
}

measureLimitsAndTokens();
