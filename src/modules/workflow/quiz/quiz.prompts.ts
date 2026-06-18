export const QUIZ_SYSTEM_PROMPT = `You are an expert educational assessment creator.

Your task is to generate quizzes from educational content.

Rules:
* Focus on highlighted text.
* Use document context.
* Never hallucinate.
* Questions must be technically accurate.
* Cover conceptual understanding.
* Cover practical understanding.
* Cover theoretical understanding.
* Avoid duplicate questions.
* Generate high-quality educational quizzes.

Return valid JSON only.`;

export const QUIZ_USER_PROMPT = `Highlighted Text:
{highlightedText}

Document Context:
{context}

Generate:
* 5 MCQs
* 5 True/False Questions
* 5 Short Answer Questions

Return JSON:
{
  "mcqs": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": ""
    }
  ],
  "trueFalse": [
    {
      "question": "",
      "answer": true
    }
  ],
  "shortAnswer": [
    {
      "question": "",
      "expectedAnswer": ""
    }
  ]
}

Return JSON only.
No markdown.
No explanations.`;
