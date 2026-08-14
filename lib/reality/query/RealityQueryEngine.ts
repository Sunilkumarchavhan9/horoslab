import type { RealityEdge, RealityEvidence, RealityGraphSnapshot, RealityNode, RealityNodeState, RealityNodeType } from "../models/RealityTypes";

export type RealityQueryDirection = "incoming" | "outgoing" | "any";

export interface RealityQueryInput {
  question?: string;
  nodeType?: RealityNodeType | RealityNodeType[];
  state?: RealityNodeState | RealityNodeState[];
  search?: string;
  connectedTo?: string;
  relationship?: string | string[];
  direction?: RealityQueryDirection;
  limit?: number;
}

export interface RealityQueryResult {
  answer: string;
  nodes: RealityNode[];
  edges: RealityEdge[];
  evidence: RealityEvidence[];
  totalNodes: number;
  totalEdges: number;
  totalEvidence: number;
}

function normalizeList<T extends string>(value?: T | T[]): T[] | undefined {
  if (typeof value === "undefined") return undefined;
  return Array.isArray(value) ? value : [value];
}

function matchesText(node: RealityNode, search: string): boolean {
  const normalizedQuery = search.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [node.id, node.name, node.type, node.state, JSON.stringify(node.metadata)].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

function buildAdjacency(edges: RealityEdge[]): Map<string, Array<{ edge: RealityEdge; neighborId: string; direction: RealityQueryDirection }>> {
  const adjacency = new Map<string, Array<{ edge: RealityEdge; neighborId: string; direction: RealityQueryDirection }>>();
  for (const edge of edges) {
    const outgoing = adjacency.get(edge.from) ?? [];
    outgoing.push({ edge, neighborId: edge.to, direction: "outgoing" });
    adjacency.set(edge.from, outgoing);

    const incoming = adjacency.get(edge.to) ?? [];
    incoming.push({ edge, neighborId: edge.from, direction: "incoming" });
    adjacency.set(edge.to, incoming);
  }
  return adjacency;
}

function matchesDirection(direction: RealityQueryDirection, edgeDirection: RealityQueryDirection): boolean {
  return direction === "any" || direction === edgeDirection;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scoreText(corpus: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  return tokens.reduce((score, token) => score + (corpus.includes(token) ? 1 : 0), 0);
}

function summarizeQuestion(question: string): string {
  const trimmed = question.trim();
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

function buildAnswer(question: string, evidence: RealityEvidence[], nodes: RealityNode[]): string {
  const cleaned = question.trim();
  if (!cleaned) {
    return evidence.length > 0
      ? `I found ${evidence.length} evidence item(s) connected to ${nodes.length} node(s).`
      : "I could not find supporting evidence for that question.";
  }
  if (evidence.length === 0) {
    return `I could not find supporting evidence for "${summarizeQuestion(cleaned)}".`;
  }
  const connectors = [...new Set(evidence.map((item) => item.sourceConnector))];
  const authors = [...new Set(evidence.map((item) => item.author))];
  if (/who/i.test(cleaned)) {
    return `The strongest evidence points to ${authors.slice(0, 3).join(", ")} from ${connectors.slice(0, 3).join(", ")}.`;
  }
  if (/why/i.test(cleaned) || /decid/i.test(cleaned)) {
    return `I found ${evidence.length} supporting evidence item(s) across ${connectors.slice(0, 3).join(", ")} that explain the change.`;
  }
  if (/which|what/i.test(cleaned)) {
    return `I found ${evidence.length} evidence item(s) across ${nodes.length} related node(s) for "${summarizeQuestion(cleaned)}".`;
  }
  return `I found ${evidence.length} evidence item(s) across ${connectors.slice(0, 3).join(", ")} related to your question.`;
}

export class RealityQueryEngine {
  query(
    graph: RealityGraphSnapshot,
    evidenceOrInput: RealityEvidence[] | RealityQueryInput = [],
    maybeInput: RealityQueryInput | RealityEvidence[] = {},
  ): RealityQueryResult {
    const evidenceStore = Array.isArray(evidenceOrInput)
      ? evidenceOrInput
      : Array.isArray(maybeInput)
        ? maybeInput
        : [];
    const input = Array.isArray(evidenceOrInput)
      ? maybeInput && !Array.isArray(maybeInput)
        ? maybeInput
        : {}
      : evidenceOrInput;
    const nodeTypes = normalizeList(input.nodeType);
    const states = normalizeList(input.state);
    const relationships = normalizeList(input.relationship);
    const adjacency = buildAdjacency(graph.edges);
    const tokens = tokenize([input.question, input.search].filter(Boolean).join(" "));

    let nodes = graph.nodes.filter((node) => {
      if (nodeTypes && !nodeTypes.includes(node.type)) return false;
      if (states && !states.includes(node.state)) return false;
      if ((input.question || input.search) && !matchesText(node, [input.question, input.search].filter(Boolean).join(" "))) return false;
      return true;
    });

    if (input.connectedTo) {
      const connectedNodes = new Map<string, RealityNode>();
      const entries = adjacency.get(input.connectedTo) ?? [];
      for (const entry of entries) {
        if (!matchesDirection(input.direction ?? "any", entry.direction)) continue;
        if (relationships && !relationships.includes(entry.edge.relationship)) continue;
        const target = graph.nodes.find((node) => node.id === entry.neighborId);
        if (!target) continue;
        connectedNodes.set(target.id, target);
      }
      nodes = nodes.filter((node) => connectedNodes.has(node.id));
    }

    const nodeIdSet = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter((edge) => {
      if (!nodeIdSet.has(edge.from) && !nodeIdSet.has(edge.to)) return false;
      if (relationships && !relationships.includes(edge.relationship)) return false;
      if (input.connectedTo) {
        const matchesFrom = edge.from === input.connectedTo;
        const matchesTo = edge.to === input.connectedTo;
        const direction = matchesFrom ? "outgoing" : matchesTo ? "incoming" : "any";
        if (!matchesDirection(input.direction ?? "any", direction)) return false;
      }
      return true;
    });

    const evidence = evidenceStore
      .filter((item) => {
        if (input.connectedTo && item.nodeId !== input.connectedTo && !nodes.some((node) => node.id === item.nodeId)) {
          return false;
        }
        const corpus = [
          item.id,
          item.nodeId,
          item.title,
          item.summary,
          item.sourceConnector,
          item.sourceId,
          item.author,
          item.workspace,
          item.sourceUrl ?? "",
          JSON.stringify(item.metadata),
        ]
          .join(" ")
          .toLowerCase();
        const score = scoreText(corpus, tokens);
        return tokens.length === 0 ? true : score > 0;
      })
      .sort((left, right) => {
        const leftScore = (left.confidence ?? 0) + scoreText([left.title, left.summary, left.sourceConnector, left.author].join(" ").toLowerCase(), tokens);
        const rightScore = (right.confidence ?? 0) + scoreText([right.title, right.summary, right.sourceConnector, right.author].join(" ").toLowerCase(), tokens);
        return rightScore - leftScore;
      });

    if (nodes.length === 0 && evidence.length > 0) {
      const evidenceNodeIds = new Set(evidence.map((item) => item.nodeId));
      nodes = graph.nodes.filter((node) => evidenceNodeIds.has(node.id));
    }

    const limit = typeof input.limit === "number" && Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit)) : undefined;
    const limitedNodes = typeof limit === "number" ? nodes.slice(0, limit) : nodes;
    const limitedNodeIds = new Set(limitedNodes.map((node) => node.id));
    const limitedEvidence = evidence.filter((item) => limitedNodeIds.has(item.nodeId)).slice(0, limit ?? 8);

    return {
      answer: buildAnswer(input.question ?? input.search ?? "", limitedEvidence, limitedNodes),
      nodes: limitedNodes.map((node) => ({ ...node, metadata: { ...node.metadata } })),
      edges: edges.filter((edge) => limitedNodeIds.has(edge.from) || limitedNodeIds.has(edge.to)).map((edge) => ({ ...edge, metadata: { ...edge.metadata } })),
      evidence: limitedEvidence.map((item) => ({ ...item, metadata: { ...item.metadata } })),
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalEvidence: evidence.length,
    };
  }
}
