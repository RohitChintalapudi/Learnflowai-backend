import { prisma } from "../src/database/prisma";
import { runAnalogyWorkflow } from "../src/modules/workflow/analogy/analogy.graph";

async function main() {
  const document = await prisma.document.findFirst();
  if (!document) {
    console.error("No document found in db");
    return;
  }
  
  const highlightedText = "Operating System";
  const style = "gaming";
  
  console.log("Starting analogy generation...");
  const start = Date.now();
  
  try {
    const result = await runAnalogyWorkflow(document.id, highlightedText, style, "test-user");
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log("Result success:", !!result.analogyData);
    console.log("Analogy Data:", JSON.stringify(result.analogyData, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
