import { RealityRuntime } from "./runtime/RealityRuntime";

export const realityRuntime = RealityRuntime;

export function getRealityNode(nodeId: string) {
  return RealityRuntime.getNode(nodeId);
}

export function getRealityNeighbors(nodeId: string) {
  return RealityRuntime.getNeighbors(nodeId);
}

export function listRealityNodes() {
  return RealityRuntime.listNodes();
}

export function listRealityEdges() {
  return RealityRuntime.listEdges();
}

export function listRealityEvents(limit = 100) {
  return RealityRuntime.listEvents(limit);
}

export function connectRealityNodes(input: {
  from: string;
  to: string;
  relationship: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}) {
  return RealityRuntime.connect(input);
}

export function disconnectRealityNodes(edgeId: string) {
  return RealityRuntime.disconnect(edgeId);
}

export function appendRealityEvent(input: {
  nodeId: string;
  type: string;
  payload?: Record<string, unknown>;
  source?: string;
}) {
  return RealityRuntime.appendEvent(input);
}

export function getRealitySnapshot() {
  return RealityRuntime.getSnapshot();
}

export function getRealityStatus() {
  return RealityRuntime.getStatus();
}

export function resetRealityStoreForTests(): void {
  RealityRuntime.resetForTests();
}

export { RealityRuntime };
export * from "./models/RealityTypes";

