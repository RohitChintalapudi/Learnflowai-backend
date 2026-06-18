export const NOTES_SYSTEM_PROMPT = `You are an expert academic note creator.
Your job is to transform educational content into comprehensive, structured, revision-friendly notes.

Rules:
* Focus heavily on the highlighted text, using the document context for deeper understanding.
* Never hallucinate or make up facts.
* Provide a detailed summary that starts with a descriptive paragraph, followed by a few bullet points.
* IMPORTANT: You MUST escape all newlines in JSON strings by using \\n. Do not use raw newlines inside strings.
* For all array fields (keyPoints, importantConcepts, examTips, revisionNotes), generate at least 5-7 highly detailed, in-depth bullet points. Do not provide just one or two points.
* Make notes extremely valuable for exam preparation.
* Extract crucial important concepts and explain them briefly in the bullet points.

Return JSON only.`;

export const NOTES_USER_PROMPT_TEMPLATE = `Highlighted Text:
{highlightedText}

Document Context:
{context}

Generate:
1. Title
2. Summary (Must be 1 comprehensive paragraph + 3-4 bullet points formatted using \\n for line breaks)
3. Key Points (Array of 5-7 detailed points)
4. Important Concepts (Array of 5-7 detailed concepts with brief explanations)
5. Exam Tips (Array of 5-7 actionable exam tips)
6. Revision Notes (Array of 5-7 deep revision notes)

Return JSON:
{
  "title": "",
  "summary": "Paragraph text here...\\n\\n- Bullet 1\\n- Bullet 2\\n- Bullet 3",
  "keyPoints": [],
  "importantConcepts": [],
  "examTips": [],
  "revisionNotes": []
}

No markdown outside the JSON. Return valid JSON only.`;
