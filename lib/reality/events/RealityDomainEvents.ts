import { randomUUID } from "node:crypto";
import type { RuntimeContext, RuntimeEvent, RuntimeEventInput } from "../../runtime/RuntimeBus";
import type { RealityConnection } from "../connections/ConnectionService";
import type { RealityDecision } from "../decisions/DecisionService";
import type { RealityEdge, RealityNode, RealityEvent as RealityLogEvent } from "../models/RealityTypes";
import type { RealityImpactAssessment } from "../impacts/ImpactService";
import type { RealitySource } from "../sources/SourceService";

export type RealityDomainEventType =
  | "RealityNodeCreated"
  | "RealityNodeUpdated"
  | "RealityNodeDeleted"
  | "RealityEdgeCreated"
  | "RealityEdgeDeleted"
  | "RealityEventRecorded"
  | "DecisionCreated"
  | "ImpactCalculated"
  | "SourceRegistered"
  | "SourceSynced"
  | "SourceIndexed"
  | "ConnectionHealthy"
  | "ConnectionFailed"
  | "ApiSchemaChanged";

export interface RealityDomainEventPayloadMap {
  RealityNodeCreated: { node: RealityNode };
  RealityNodeUpdated: { node: RealityNode; previousNode: RealityNode | null };
  RealityNodeDeleted: { nodeId: string };
  RealityEdgeCreated: { edge: RealityEdge };
  RealityEdgeDeleted: { edgeId: string; edge: RealityEdge | null };
  RealityEventRecorded: { event: RealityLogEvent };
  DecisionCreated: { decision: RealityDecision };
  ImpactCalculated: { impact: RealityImpactAssessment };
  SourceRegistered: { source: RealitySource };
  SourceSynced: { source: RealitySource };
  SourceIndexed: { source: RealitySource };
  ConnectionHealthy: { connection: RealityConnection };
  ConnectionFailed: { connection: RealityConnection };
  ApiSchemaChanged: { api: string; version: string };
}

export type RealityDomainEvent<TType extends RealityDomainEventType = RealityDomainEventType> = RuntimeEvent<
  TType,
  RealityDomainEventPayloadMap[TType]
>;

export type RealityDomainEventInput<TType extends RealityDomainEventType = RealityDomainEventType> = RuntimeEventInput<
  TType,
  RealityDomainEventPayloadMap[TType]
>;

export function createRealityDomainEvent<TType extends RealityDomainEventType>(
  runtime: string,
  type: TType,
  payload: RealityDomainEventPayloadMap[TType],
  options?: {
    correlationId?: string;
    causationId?: string;
    context?: Partial<RuntimeContext>;
    metadata?: Record<string, unknown>;
  },
): RealityDomainEventInput<TType> {
  const correlationId = options?.correlationId ?? randomUUID();
  return {
    id: randomUUID(),
    type,
    runtime,
    timestamp: new Date(),
    correlationId,
    version: 1,
    ...(options?.context ? { context: { ...options.context } } : {}),
    payload,
    ...(options?.causationId ? { causationId: options.causationId } : {}),
    ...(options?.metadata ? { metadata: { ...options.metadata } } : {}),
  };
}
