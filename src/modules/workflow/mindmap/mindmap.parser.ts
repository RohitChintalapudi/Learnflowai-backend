export function extractJsonString(text: string): string {
	if (typeof text !== "string") return "";
	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		return text.substring(firstBrace, lastBrace + 1).trim();
	}
	const firstBracket = text.indexOf("[");
	const lastBracket = text.lastIndexOf("]");
	if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
		return text.substring(firstBracket, lastBracket + 1).trim();
	}
	const markdownBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (markdownBlockMatch && markdownBlockMatch[1]) {
		return markdownBlockMatch[1].trim();
	}
	return text.trim();
}

export function validateMindMapJson(data: any): boolean {
	try {
		const mindMap = typeof data === "string" ? JSON.parse(extractJsonString(data)) : data;

		if (!mindMap || typeof mindMap !== "object") return false;
		if (!Array.isArray(mindMap.nodes) || mindMap.nodes.length === 0) return false;
		if (!Array.isArray(mindMap.edges)) {
			mindMap.edges = [];
		}

		const nodeIds = new Set<string>();
		for (const node of mindMap.nodes) {
			if (!node || typeof node !== "object") continue;
			if (!node.id) node.id = `node_${nodeIds.size + 1}`;
			if (!node.label) node.label = "Concept";
			nodeIds.add(node.id);
		}

		if (nodeIds.size === 0) return false;

		const rootId = mindMap.nodes[0].id;
		const validEdges: any[] = [];
		const connectedNodes = new Set<string>([rootId]);

		for (const edge of mindMap.edges) {
			if (edge && edge.source && edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
				validEdges.push(edge);
				connectedNodes.add(edge.source);
				connectedNodes.add(edge.target);
			}
		}

		// Auto-heal orphan nodes by connecting to root node
		for (const node of mindMap.nodes) {
			if (!connectedNodes.has(node.id)) {
				validEdges.push({
					id: `e_${rootId}_${node.id}`,
					source: rootId,
					target: node.id,
				});
				connectedNodes.add(node.id);
			}
		}

		mindMap.edges = validEdges;
		return true;
	} catch (error) {
		return false;
	}
}

