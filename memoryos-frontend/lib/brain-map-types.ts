export type BrainMapNode = {
  id: string;
  memoryId?: string;
  eventId?: string;
  x: number;
  y: number;
  r: number;
  label: string;
  detail: string;
  kind: "session" | "operation" | "memory" | "agent";
  group: string;
};

export type BrainMapEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  detail: string;
  opacity: number;
};

export type BrainMapGraph = {
  nodes: BrainMapNode[];
  edges: BrainMapEdge[];
};

export type BrainMapSelection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;
