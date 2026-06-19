import { Annotation } from "@langchain/langgraph";

export const TopicExpansionState = {
  mainTopic: Annotation<string>(),
  keywords: Annotation<string[]>(),
  subjectArea: Annotation<string>(),
  relatedConcepts: Annotation<string[]>(),
  subtopics: Annotation<string[]>(),
  prerequisites: Annotation<string[]>(),
};
