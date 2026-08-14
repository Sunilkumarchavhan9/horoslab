import type { RealityEdge, RealityGraphSnapshot, RealityNode } from "../models/RealityTypes";

export interface GraphRepository {
  replace(snapshot: RealityGraphSnapshot): void;
  getNode(nodeId: string): RealityNode | null;
  saveNode(node: RealityNode): RealityNode;
  deleteNode(nodeId: string): boolean;
  listNodes(): RealityNode[];
  getEdge(edgeId: string): RealityEdge | null;
  saveEdge(edge: RealityEdge): RealityEdge;
  deleteEdge(edgeId: string): boolean;
  listEdges(): RealityEdge[];
}
