export interface MindMapNode {
  id: string;
  label: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
}

export interface ReactFlowMindMap {
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface MindMapState {
  documentId: string;
  highlightedText: string;
  mainTopic: string;
  relatedConcepts: string[];
  subtopics: string[];
  prerequisites: string[];
  retrievedChunks: any[];
  context: string;
  mindMapData: ReactFlowMindMap;
  title: string;
}

export interface MindMapResponse {
  success: boolean;
  message?: string;
  mindMap?: ReactFlowMindMap & { id: string };
}
