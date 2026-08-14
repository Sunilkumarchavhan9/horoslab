import { randomUUID } from "node:crypto";
import { findShortestPath, searchGraph, traverseGraph } from "./GraphAlgorithms";
import { validateGraph } from "./GraphValidator";
import type { RealityEdge, RealityGraphSnapshot, RealityNode, RealityNodeState, RealityNodeType } from "../models/RealityTypes";
import type { GraphRepository } from "../repositories/GraphRepository";

function nowIso(): string {
  return new Date().toISOString();
}

function compactId(value: string): string {
  const compacted = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return compacted || "node";
}

export class GraphEngine {
  constructor(private readonly repository: GraphRepository) {}

  reset(initialGraph: RealityGraphSnapshot): void {
    this.repository.replace(initialGraph);
  }

  createNode(input: {
    type: RealityNodeType;
    name: string;
    state?: RealityNodeState;
    metadata?: Record<string, unknown>;
    sourceConnector?: string;
    sourceId?: string;
    timestamp?: string;
    author?: string;
    workspace?: string;
    confidence?: number;
    evidenceIds?: string[];
  }): RealityNode {
    const timestamp = nowIso();
    const node: RealityNode = {
      id: compactId(input.name),
      type: input.type,
      name: input.name,
      state: input.state ?? "healthy",
      metadata: input.metadata ?? {},
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(input.sourceConnector ? { sourceConnector: input.sourceConnector } : {}),
      ...(input.sourceId ? { sourceId: input.sourceId } : {}),
      ...(input.timestamp ? { timestamp: input.timestamp } : {}),
      ...(input.author ? { author: input.author } : {}),
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(typeof input.confidence === "number" ? { confidence: input.confidence } : {}),
      ...(input.evidenceIds ? { evidenceIds: [...input.evidenceIds] } : {}),
    };
    return this.repository.saveNode(node);
  }

  updateNode(
    nodeId: string,
    input: Partial<
      Pick<
        RealityNode,
        | "name"
        | "type"
        | "state"
        | "metadata"
        | "sourceConnector"
        | "sourceId"
        | "timestamp"
        | "author"
        | "workspace"
        | "confidence"
        | "evidenceIds"
      >
    >,
  ): RealityNode | null {
    const existing = this.repository.getNode(nodeId);
    if (!existing) return null;
    const updated: RealityNode = {
      ...existing,
      ...(input.name ? { name: input.name } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.state ? { state: input.state } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.sourceConnector ? { sourceConnector: input.sourceConnector } : {}),
      ...(input.sourceId ? { sourceId: input.sourceId } : {}),
      ...(input.timestamp ? { timestamp: input.timestamp } : {}),
      ...(input.author ? { author: input.author } : {}),
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(typeof input.confidence === "number" ? { confidence: input.confidence } : {}),
      ...(input.evidenceIds ? { evidenceIds: [...input.evidenceIds] } : {}),
      updatedAt: nowIso(),
    };
    return this.repository.saveNode(updated);
  }

  removeNode(nodeId: string): boolean {
    return this.repository.deleteNode(nodeId);
  }

  connect(input: {
    from: string;
    to: string;
    relationship: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }): RealityEdge | null {
    if (!this.repository.getNode(input.from) || !this.repository.getNode(input.to)) {
      return null;
    }
    const timestamp = nowIso();
    const edge: RealityEdge = {
      id: `edge-${compactId(input.from)}-${compactId(input.to)}-${this.repository.listEdges().length + 1}`,
      from: input.from,
      to: input.to,
      relationship: input.relationship,
      confidence:
        typeof input.confidence === "number" &&
        Number.isFinite(input.confidence) &&
        input.confidence >= 0 &&
        input.confidence <= 1
          ? input.confidence
          : 0.85,
      metadata: input.metadata ?? {},
      createdAt: timestamp,
    };
    return this.repository.saveEdge(edge);
  }

  disconnect(edgeId: string): boolean {
    return this.repository.deleteEdge(edgeId);
  }

  getNode(nodeId: string): RealityNode | null {
    return this.repository.getNode(nodeId);
  }

  listNodes(): RealityNode[] {
    return this.repository.listNodes();
  }

  listEdges(): RealityEdge[] {
    return this.repository.listEdges();
  }

  getEdge(edgeId: string): RealityEdge | null {
    return this.repository.getEdge(edgeId);
  }

  neighbors(nodeId: string): Array<{
    node: RealityNode;
    edge: RealityEdge;
    direction: "incoming" | "outgoing";
  }> {
    const neighbors: Array<{
      node: RealityNode;
      edge: RealityEdge;
      direction: "incoming" | "outgoing";
    }> = [];
    const nodes = new Map(this.repository.listNodes().map((node) => [node.id, node]));

    for (const edge of this.repository.listEdges()) {
      if (edge.from !== nodeId && edge.to !== nodeId) continue;
      const neighborId = edge.from === nodeId ? edge.to : edge.from;
      const node = nodes.get(neighborId);
      if (!node) continue;
      neighbors.push({
        node,
        edge,
        direction: edge.from === nodeId ? "outgoing" : "incoming",
      });
    }

    return neighbors.sort((left, right) => left.node.name.localeCompare(right.node.name));
  }

  search(query: string): RealityNode[] {
    return searchGraph(this.listNodes(), query);
  }

  traverse(startId: string, options?: { depthLimit?: number }): RealityNode[] {
    return traverseGraph(startId, this.listNodes(), this.listEdges(), options);
  }

  shortestPath(from: string, to: string): RealityNode[] {
    return findShortestPath(from, to, this.listNodes(), this.listEdges());
  }

  validateGraph(): { valid: boolean; errors: string[] } {
    return validateGraph(this.listNodes(), this.listEdges());
  }

  snapshot(): RealityGraphSnapshot {
    return {
      nodes: this.listNodes(),
      edges: this.listEdges(),
    };
  }

  serializeForStatus(): {
    nodes: number;
    edges: number;
    countsByType: Record<string, number>;
  } {
    const nodes = this.listNodes();
    const edges = this.listEdges();
    const countsByType = nodes.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] ?? 0) + 1;
      return acc;
    }, {});

    return {
      nodes: nodes.length,
      edges: edges.length,
      countsByType,
    };
  }

  getEdgeCount(): number {
    return this.repository.listEdges().length;
  }

  getNodeCount(): number {
    return this.repository.listNodes().length;
  }

  listNodeIds(): string[] {
    return this.repository.listNodes().map((node) => node.id);
  }

  createTestNodeId(name: string): string {
    return compactId(name) || randomUUID();
  }
}
