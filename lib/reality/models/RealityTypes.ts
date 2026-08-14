export type RealityNodeState = "healthy" | "warning" | "critical" | "offline";

export type RealityNodeType =
  | "repository"
  | "service"
  | "database"
  | "api"
  | "institution"
  | "agent"
  | "mission"
  | "policy"
  | "worker"
  | "evidence"
  | "decision"
  | "connection"
  | "source"
  | "event"
  | "prediction"
  | "watcher";

export interface RealityNode {
  id: string;
  type: RealityNodeType;
  name: string;
  state: RealityNodeState;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sourceConnector?: string;
  sourceId?: string;
  timestamp?: string;
  author?: string;
  workspace?: string;
  confidence?: number;
  evidenceIds?: string[];
}

export interface RealityEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
  confidence: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RealityEvent {
  id: string;
  nodeId: string;
  type: string;
  payload: Record<string, unknown>;
  source: string;
  timestamp: string;
}

export interface RealityGraphSnapshot {
  nodes: RealityNode[];
  edges: RealityEdge[];
}

export interface RealityEvidence {
  id: string;
  nodeId: string;
  title: string;
  summary: string;
  sourceConnector: string;
  sourceId: string;
  timestamp: string;
  author: string;
  workspace: string;
  confidence: number;
  sourceUrl?: string;
  metadata: Record<string, unknown>;
}
