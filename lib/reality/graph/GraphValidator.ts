import type { RealityEdge, RealityNode } from "../models/RealityTypes";

export function validateGraph(
  nodes: RealityNode[],
  edges: RealityEdge[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`Edge ${edge.id} references missing source node ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`Edge ${edge.id} references missing target node ${edge.to}`);
    }
    if (edge.from === edge.to) {
      errors.push(`Edge ${edge.id} cannot connect a node to itself`);
    }
    if (edge.confidence < 0 || edge.confidence > 1 || Number.isNaN(edge.confidence)) {
      errors.push(`Edge ${edge.id} has invalid confidence ${edge.confidence}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

