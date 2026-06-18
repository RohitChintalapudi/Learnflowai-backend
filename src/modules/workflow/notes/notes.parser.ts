import { GeneratedNotes } from "./notes.types";

export const parseNotesResponse = (jsonString: string): GeneratedNotes | null => {
  try {
    // Remove potential markdown wrappers if the model hallucinates them
    let cleanJson = jsonString.trim();
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.endsWith("\`\`\`")) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    
    cleanJson = cleanJson.trim();
    const parsed = JSON.parse(cleanJson);
    
    // Basic validation to ensure required fields exist
    if (
      typeof parsed.title === "string" &&
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.keyPoints) &&
      Array.isArray(parsed.importantConcepts) &&
      Array.isArray(parsed.examTips) &&
      Array.isArray(parsed.revisionNotes)
    ) {
      return parsed as GeneratedNotes;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to parse notes response:", error);
    return null;
  }
};
