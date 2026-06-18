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
    console.log(`Highlighted Text: ${highlightedText}`);

    const service = new NotesService();
    const result = await service.generateNotes(doc.id, highlightedText, userId);
    
    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));

  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
