import { prisma } from "../src/database";
import { MindMapService } from "../src/modules/workflow/mindmap/mindmap.service";

async function testMindmap() {
  console.log("Fetching a document from DB to test...");
  const document = await prisma.document.findFirst({
    include: {
      chunks: {
        take: 1
      }
    }
  });

  if (!document) {
    console.error("No documents found in the database. Cannot run test.");
    return;
  }

  // Assuming chunks have content, we'll just pick a highlight string from the first chunk or use a generic one if no chunks.
  let highlightedText = "Object Oriented Programming";
  if (document.chunks && document.chunks.length > 0) {
    const content = document.chunks[0].content;
    // Just grab a snippet of 50 chars as "highlighted text"
    if (content.length > 50) {
      highlightedText = content.substring(0, 50);
    }
  }

  console.log(`Using Document ID: ${document.id}`);
  console.log(`Highlighted Text: "${highlightedText}"`);

  const userId = document.uploadedBy || "dummy-user-id";

  const mindMapService = new MindMapService();
  
  console.log("Generating Mind Map...");
  const result = await mindMapService.generateMindMap(document.id, highlightedText, userId);
  
  console.log("Generation Result:");
  console.log(JSON.stringify(result, null, 2));

  process.exit(0);
}

testMindmap().catch(console.error);
