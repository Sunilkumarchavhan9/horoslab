import type { RealityEdge, RealityGraphSnapshot, RealityNode } from "../../models/RealityTypes";
import type { GraphRepository } from "../GraphRepository";

function cloneNode(node: RealityNode): RealityNode {
  return {
    ...node,
    metadata: { ...node.metadata },
  };
}

function cloneEdge(edge: RealityEdge): RealityEdge {
  return {
    ...edge,
    metadata: { ...edge.metadata },
  };
}

export class InMemoryGraphRepository implements GraphRepository {
  private nodes: Map<string, RealityNode>;

  private edges: Map<string, RealityEdge>;

  constructor(seedGraph: RealityGraphSnapshot) {
    this.nodes = new Map();
    this.edges = new Map();
    this.replace(seedGraph);
  }

  replace(snapshot: RealityGraphSnapshot): void {
    this.nodes = new Map(snapshot.nodes.map((node) => [node.id, cloneNode(node)]));
    this.edges = new Map(snapshot.edges.map((edge) => [edge.id, cloneEdge(edge)]));
  }

  getNode(nodeId: string): RealityNode | null {
    const node = this.nodes.get(nodeId);
    return node ? cloneNode(node) : null;
  }

  saveNode(node: RealityNode): RealityNode {
    const stored = cloneNode(node);
    this.nodes.set(stored.id, stored);
    return cloneNode(stored);
  }

  deleteNode(nodeId: string): boolean {
    const removed = this.nodes.delete(nodeId);
    if (!removed) return false;
    for (const edge of [...this.edges.values()]) {
      if (edge.from === nodeId || edge.to === nodeId) {
        this.edges.delete(edge.id);
      }
    }
    return true;
  }

  listNodes(): RealityNode[] {
    return [...this.nodes.values()].map(cloneNode);
  }

  getEdge(edgeId: string): RealityEdge | null {
    const edge = this.edges.get(edgeId);
    return edge ? cloneEdge(edge) : null;
  }

  saveEdge(edge: RealityEdge): RealityEdge {
    const stored = cloneEdge(edge);
    this.edges.set(stored.id, stored);
    return cloneEdge(stored);
  }

  deleteEdge(edgeId: string): boolean {
    return this.edges.delete(edgeId);
  }

  listEdges(): RealityEdge[] {
    return [...this.edges.values()].map(cloneEdge);
  }
}
