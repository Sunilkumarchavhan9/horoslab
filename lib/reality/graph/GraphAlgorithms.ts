import type { RealityEdge, RealityNode } from "../models/RealityTypes";

function getAdjacentNodeIds(nodeId: string, edges: RealityEdge[]): string[] {
  const neighbors = new Set<string>();
  for (const edge of edges) {
    if (edge.from === nodeId) neighbors.add(edge.to);
    if (edge.to === nodeId) neighbors.add(edge.from);
  }
  return [...neighbors];
}

export function searchGraph(
  nodes: RealityNode[],
  query: string,
): RealityNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...nodes];

  return nodes.filter((node) => {
    const haystacks = [
      node.id,
      node.name,
      node.type,
      node.state,
      JSON.stringify(node.metadata),
    ];
    return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function traverseGraph(
  startId: string,
  nodes: RealityNode[],
  edges: RealityEdge[],
  options?: { depthLimit?: number },
): RealityNode[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  if (!nodeMap.has(startId)) return [];

  const depthLimit =
    typeof options?.depthLimit === "number" && Number.isFinite(options.depthLimit)
      ? Math.max(0, Math.floor(options.depthLimit))
      : Number.POSITIVE_INFINITY;

  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
  const ordered: RealityNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const node = nodeMap.get(current.id);
    if (!node) continue;
    ordered.push(node);
    if (current.depth >= depthLimit) continue;

    for (const neighborId of getAdjacentNodeIds(current.id, edges)) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      queue.push({ id: neighborId, depth: current.depth + 1 });
    }
  }

  return ordered;
}

export function findShortestPath(
  from: string,
  to: string,
  nodes: RealityNode[],
  edges: RealityEdge[],
): RealityNode[] {
  if (from === to) {
    return nodes.filter((node) => node.id === from);
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  if (!nodeMap.has(from) || !nodeMap.has(to)) return [];

  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    const currentId = path[path.length - 1];

    for (const neighborId of getAdjacentNodeIds(currentId, edges)) {
      if (visited.has(neighborId)) continue;
      const nextPath = [...path, neighborId];
      if (neighborId === to) {
        return nextPath
          .map((nodeId) => nodeMap.get(nodeId))
          .filter((node): node is RealityNode => Boolean(node));
      }
      visited.add(neighborId);
      queue.push(nextPath);
    }
  }

  return [];
}

