export const QUIZ_SYSTEM_PROMPT = `You are an expert educational assessment creator.

Your task is to generate quizzes from educational content.

Rules:
* Generate questions covering the Main Topic, Related Concepts, and Important Subtopics provided in the context.
* Ensure a holistic assessment of the topic, even if some concepts are not explicitly in the highlighted text but are provided in the Related Concepts section.
* Use document context as background information to ground the questions technically.
* Never hallucinate.
* Questions must be technically accurate.
* Cover conceptual understanding.
* Cover practical understanding.
* Cover theoretical understanding.
* Avoid duplicate questions.
* Generate high-quality educational quizzes.

Return valid JSON only.`;

export const QUIZ_USER_PROMPT = `TARGET TOPIC (Generate questions ONLY from this):
---
{highlightedText}
---

BACKGROUND CONTEXT (DO NOT generate questions from this. Use ONLY to define terms or understand the target topic):
---
{context}
---

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
      "correctAnswer": "",
      "topic": ""
    }
  ],
  "trueFalse": [
    {
      "question": "",
      "answer": true,
      "topic": ""
    }
  ],
  "shortAnswer": [
    {
      "question": "",
      "expectedAnswer": "",
      "topic": ""
    }
  ]
}

Return JSON only.
No markdown.
No explanations.`;
