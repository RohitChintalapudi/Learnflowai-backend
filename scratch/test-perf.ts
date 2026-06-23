import { runMindMapWorkflow } from "../src/modules/workflow/mindmap/mindmap.graph";

async function main() {
  const documentId = "test-doc";
  const highlightedText = "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.";
  
  console.log("Starting mindmap generation...");
  const start = Date.now();
  
  try {
    const result = await runMindMapWorkflow(documentId, highlightedText, "test-user");
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log("Result success:", !!result.mindMapData);
    console.log("Mind map data:", JSON.stringify(result.mindMapData, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
