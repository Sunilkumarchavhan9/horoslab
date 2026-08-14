import { emitMemoryRealtimeEvent } from "../memory/realtimeEventBus";
import { listMemoryRealtimeEvents } from "../memory/realtimeEventStore";
import type { MemoryRealtimeEvent } from "../memory/types";
import { queueEpochWebhookDeliveries } from "./epochWebhooks";
import { createCorrelation } from "./v12/adapters";

export type EpochRuntimeEventKind =
  | "epoch.institution.created"
  | "epoch.institution.updated"
  | "epoch.institution.archived"
  | "epoch.institution.deleted"
  | "epoch.institution.cloned"
  | "epoch.mission.created"
  | "epoch.mission.updated"
  | "epoch.mission.queued"
  | "epoch.mission.running"
  | "epoch.mission.completed"
  | "epoch.mission.failed"
  | "epoch.evidence.recorded"
  | "epoch.verification.completed"
  | "epoch.certificate.issued"
  | "epoch.memory.recorded"
  | "epoch.integration.upserted"
  | "epoch.queue.enqueued"
  | "epoch.queue.leased"
  | "epoch.queue.acknowledged"
  | "epoch.queue.failed"
  | "epoch.execution.stream_delta"
  | "epoch.ai_execution.telemetry"
  | "epoch.ai_execution.routed"
  | "epoch.ai_execution.completed"
  | "epoch.ai_execution.failed"
  | "epoch.edge.telemetry"
  | "epoch.edge.update_verified"
  | "epoch.edge.enrolled"
  | "epoch.edge.capabilities_advertised"
  | "epoch.edge.reconciled"
  | "epoch.edge.update_rolled_back"
  | "epoch.edge.revoked"
  | "epoch.cloud.action"
  | "epoch.simulation.created"
  | "epoch.simulation.started"
  | "epoch.simulation.completed"
  | "epoch.simulation.verified"
  | "epoch.simulation.promoted"
  | "epoch.simulation.rejected"
  | "epoch.automation.created"
  | "epoch.automation.triggered"
  | "epoch.automation.approval_required"
  | "epoch.automation.completed"
  | "epoch.automation.failed"
  | "epoch.automation.budget_denied"
  | "epoch.capability.gap_identified"
  | "epoch.capability.plan_created"
  | "epoch.capability.promoted"
  | "epoch.capability.rolled_back"
  | "epoch.unknown.created"
  | "epoch.discovery_program.created"
  | "epoch.hypothesis.created"
  | "epoch.experiment.created"
  | "epoch.observation.recorded"
  | "epoch.architecture.started"
  | "epoch.architecture.stage_completed"
  | "epoch.architecture.completed"
  | "epoch.architecture.failed"
  | "epoch.outcome.recorded"
  | "epoch.experience.recorded";

export function emitEpochRuntimeEvent(input: {
  userId: string;
  orgId?: string;
  workspaceId: string;
  kind: EpochRuntimeEventKind;
  label: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  contractVersion?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
}): void {
  const correlation = createCorrelation(input.subjectId ?? input.workspaceId);
  const correlationId = input.correlationId ?? correlation.correlationId;
  const traceId = input.traceId ?? correlation.traceId;
  const eventPayload = {
    workspaceId: input.workspaceId,
    epochKind: input.kind,
    correlationId,
    traceId,
    ...input.payload,
    at: new Date().toISOString(),
  };
  emitMemoryRealtimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    contractVersion: input.contractVersion ?? "epoch.event.v1",
    correlationId,
    causationId: input.causationId,
    traceId,
    kind: "timeline_updated",
    source: "system",
    subject: {
      type: "workspace",
      id: input.subjectId ?? input.workspaceId,
      label: input.label,
    },
    payload: {
      ...eventPayload,
    },
  });
  void queueEpochWebhookDeliveries({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: input.kind,
    label: input.label,
    subjectId: input.subjectId,
    payload: eventPayload,
    occurredAt: new Date().toISOString(),
  }).catch(() => {
    // Webhook fanout must not fail the originating event.
  });
}

export async function listEpochRuntimeEvents(input: {
  userId: string;
  workspaceId: string;
  limit?: number;
  subjectId?: string;
  kind?: EpochRuntimeEventKind;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
}): Promise<MemoryRealtimeEvent[]> {
  const requestedLimit = typeof input.limit === "number" && Number.isFinite(input.limit)
    ? Math.max(1, Math.floor(input.limit))
    : 1000;
  const events = await listMemoryRealtimeEvents(input.userId, Math.max(requestedLimit, 5000));
  return events.filter((event) => {
    const payload = event.payload as Record<string, unknown> | undefined;
    const workspaceMatches = payload?.workspaceId === input.workspaceId || payload?.epochWorkspaceId === input.workspaceId;
    const subjectMatches = input.subjectId ? event.subject?.id === input.subjectId || payload?.subjectId === input.subjectId : true;
    const kindMatches = input.kind ? payload?.epochKind === input.kind : true;
    const correlationMatches = input.correlationId ? event.correlationId === input.correlationId : true;
    const causationMatches = input.causationId ? event.causationId === input.causationId : true;
    const traceMatches = input.traceId ? event.traceId === input.traceId : true;
    return workspaceMatches && subjectMatches && kindMatches && correlationMatches && causationMatches && traceMatches;
  }).slice(0, requestedLimit);
}
