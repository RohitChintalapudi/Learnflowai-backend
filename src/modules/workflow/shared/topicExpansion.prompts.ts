export const TOPIC_DETECTION_AND_EXPANSION_SYSTEM_PROMPT = `You are an expert curriculum designer and analyzer.
Analyze the provided highlighted text to identify the core topic and expand upon it to build a comprehensive learning context.

Return JSON only:
{
  "mainTopic": "String representing the core topic",
  "keywords": ["List", "of", "important", "keywords"],
  "subjectArea": "General subject area (e.g., Computer Science, Biology)",
  "relatedConcepts": ["Concept 1", "Concept 2"],
  "subtopics": ["Subtopic 1", "Subtopic 2"],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
}`;

// Unused - kept for compatibility if needed elsewhere, though nodes are updated
export const TOPIC_DETECTION_SYSTEM_PROMPT = TOPIC_DETECTION_AND_EXPANSION_SYSTEM_PROMPT;
export const CONCEPT_EXPANSION_SYSTEM_PROMPT = TOPIC_DETECTION_AND_EXPANSION_SYSTEM_PROMPT;
export const CONCEPT_EXPANSION_USER_PROMPT = `Topic:\n{mainTopic}`;
