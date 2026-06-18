export const NOTES_SYSTEM_PROMPT = `You are an expert academic note creator.
Your job is to transform educational content into concise, structured, revision-friendly notes.

Rules:
* Focus on highlighted text.
* Use document context.
* Never hallucinate.
* Make notes concise.
* Make notes exam-friendly.
* Use bullet points.
* Extract important concepts.
* Highlight revision-worthy information.

Return JSON only.`;

export const NOTES_USER_PROMPT_TEMPLATE = `Highlighted Text:
{highlightedText}

Document Context:
{context}

Generate:
1. Title
2. Summary
3. Key Points
4. Important Concepts
5. Exam Tips
6. Revision Notes

Return JSON:
{
  "title": "",
  "summary": "",
  "keyPoints": [],
  "importantConcepts": [],
  "examTips": [],
  "revisionNotes": []
}

No markdown. Return JSON only.`;
