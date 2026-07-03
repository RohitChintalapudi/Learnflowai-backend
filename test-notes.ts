import { prisma } from './src/database';
import { NotesService } from './src/modules/workflow/notes/notes.service';

async function main() {
  try {
    const doc = await prisma.document.findFirst({
      where: {
        chunks: {
          some: {} // Ensure the document has chunks
        }
      },
      include: {
        chunks: {
          take: 1
        }
      }
    });

    if (!doc) {
      console.log("No documents with chunks found in the database.");
      return;
    }

    const userId = doc.uploadedBy || (await prisma.user.findFirst())?.id;

    if (!userId) {
      console.log("No valid user found to test with.");
      return;
    }

    console.log(`Testing with Document ID: ${doc.id}`);
    console.log(`Testing with User ID: ${userId}`);
    
    // Pick some text from the document to highlight
    const highlightedText = doc.chunks[0]?.content.substring(0, 100) || "Introduction to operating systems";
    console.log(`Highlighted Text: "${highlightedText}"`);

    // Clean up existing notes to ensure Run 1 goes to the LLM
    await prisma.generatedNote.deleteMany({
      where: {
        userId,
        documentId: doc.id,
        highlightedText: {
          equals: highlightedText.trim(),
          mode: "insensitive",
        }
      }
    });

    const service = new NotesService();

    console.log("\n--- RUN 1: Generating Notes (Should run workflow & retrieve chunks) ---");
    const start1 = Date.now();
    const result1 = await service.generateNotes(doc.id, highlightedText, userId);
    const duration1 = Date.now() - start1;
    
    console.log(`Run 1 Duration: ${duration1}ms`);
    console.log(`Retrieved Chunks Count: ${result1.retrievedChunks}`);
    console.log("Notes Title:", result1.notes?.title);

    console.log("\n--- RUN 2: Repeating request (Should be a CACHE HIT) ---");
    const start2 = Date.now();
    const result2 = await service.generateNotes(doc.id, highlightedText, userId);
    const duration2 = Date.now() - start2;
    
    console.log(`Run 2 Duration: ${duration2}ms`);
    console.log(`Is Cache Hit Success: ${result2.success}`);
    console.log(`Cache Note ID: ${result2.noteId}`);
    
    if (duration2 < 100) {
      console.log("\n🎉 SUCCESS: Query caching works and responded in < 100ms!");
    } else {
      console.log("\n⚠️ WARNING: Second run took longer than expected.");
    }

  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
