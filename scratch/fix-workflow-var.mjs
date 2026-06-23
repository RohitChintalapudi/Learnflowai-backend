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
  content = content.replace(/workflowState\?/g, 'result?');
  content = content.replace(/workflowState\./g, 'result.');

  fs.writeFileSync(filePath, content);
  console.log(`Updated workflowState to result in ${relPath}`);
}
