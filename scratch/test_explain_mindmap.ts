import { MindMapService } from "../src/modules/workflow/mindmap/mindmap.service";
import { prisma } from "../src/database";

async function testExplain() {
  const mindMap = await prisma.generatedMindMap.findFirst();
  if (!mindMap) {
    console.log("No mind map found to test explain");
    return;
  }

  console.log("Testing explainMindMap for mindMapId:", mindMap.id);
  const service = new MindMapService();
  const res = await service.explainMindMap(mindMap.id, mindMap.userId);
  console.log("Explain result:", res);
  await prisma.$disconnect();
}

testExplain();
