import { ReactFlowMindMap } from "./mindmap.types";

export function validateMindMapJson(data: any): boolean {
  try {
    const mindMap = typeof data === "string" ? JSON.parse(data) : data;

    if (!mindMap || typeof mindMap !== "object") return false;
    if (typeof mindMap.title !== "string") return false;
    if (!Array.isArray(mindMap.nodes) || !Array.isArray(mindMap.edges)) return false;

    // Hard Limits
    if (mindMap.nodes.length > 25 || mindMap.edges.length > 40) return false;

    const nodeIds = new Set<string>();
    for (const node of mindMap.nodes) {
      if (!node.id || typeof node.id !== "string" || !node.label || typeof node.label !== "string") {
        return false;
      }
      if (nodeIds.has(node.id)) return false; // Unique node ids
      nodeIds.add(node.id);
    }

    const connectedNodes = new Set<string>();
    for (const edge of mindMap.edges) {
      if (!edge.source || typeof edge.source !== "string" || !edge.target || typeof edge.target !== "string") {
        return false;
      }
      // Valid edges check
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
      
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    // No orphan nodes check (every node must be in at least one edge, unless there's only 1 node total)
    if (mindMap.nodes.length > 1) {
      for (const node of mindMap.nodes) {
        if (!connectedNodes.has(node.id)) {
          return false; // Orphan found
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
