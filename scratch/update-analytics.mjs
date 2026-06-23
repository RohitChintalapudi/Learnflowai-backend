import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/modules/workflow');

const filesToUpdate = [
  'quiz/quiz.service.ts',
  'notes/notes.service.ts',
  'mindmap/mindmap.service.ts',
  'interview-questions/interviewQuestions.service.ts',
  'explanation/explanation.service.ts'
];

for (const relPath of filesToUpdate) {
  const filePath = path.join(srcDir, relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Add Import
  if (!content.includes('AnalyticsTracker')) {
    content = 'import { AnalyticsTracker, AnalyticsEventType } from "../../analytics/analytics.tracker";\n' + content;
  }

  // Find the block
  const regex = /const analyticsEvent = \{[\s\S]*?console\.log\(JSON\.stringify\(analyticsEvent\)\);/m;

  let eventType = 'AnalyticsEventType.AI_QUIZ_GENERATED';
  if (relPath.includes('notes')) eventType = 'AnalyticsEventType.AI_NOTES_GENERATED';
  if (relPath.includes('mindmap')) eventType = 'AnalyticsEventType.AI_MINDMAP_GENERATED';
  if (relPath.includes('interview')) eventType = 'AnalyticsEventType.AI_INTERVIEW_QUESTIONS_GENERATED';
  if (relPath.includes('explanation')) eventType = 'AnalyticsEventType.AI_EXPLANATION_GENERATED';

  const replacement = `await AnalyticsTracker.trackEvent(userId, ${eventType}, { documentId });
      
      if (workflowState?.mainTopic) {
        await AnalyticsTracker.trackTopics(userId, [
          workflowState.mainTopic, 
          ...(workflowState.relatedConcepts || [])
        ]);
      }`;

  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${relPath}`);
  } else {
    console.log(`Could not find analytics block in ${relPath}`);
  }
}
