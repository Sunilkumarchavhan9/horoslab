import { randomUUID } from "node:crypto";
import { RuntimeEventSchema, type RuntimeEvent } from "./contracts";
import { enqueueEpochOutboxEvent, listEpochOutboxEvents } from "../v13/outboxService";

export async function appendCanonicalRuntimeEvent(input: Omit<RuntimeEvent, "id"> & { idempotencyKey: string }) {
  const event = RuntimeEventSchema.parse({ ...input, id: `runtime_event_${randomUUID()}` });
  const result = await enqueueEpochOutboxEvent({ workspaceId: event.workspaceId, aggregateType: event.subjectType, aggregateId: event.subjectId, eventType: event.type, idempotencyKey: input.idempotencyKey, payload: event });
  return { event, outbox: result.event, created: result.created };
}

export async function listCanonicalRuntimeEvents(workspaceId: string, limit = 100) {
  return listEpochOutboxEvents(workspaceId, limit);
}
