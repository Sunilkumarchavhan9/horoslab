import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";
import type {
  MemoryRealtimeEvent,
  MemoryRealtimeEventInput,
  MemoryRealtimeEventKind,
  MemoryRealtimeEventStage,
  MemoryRealtimeProjection,
  MemoryRealtimeSubject,
} from "./types";
import {
  MEMORY_REALTIME_EVENT_KINDS,
  MEMORY_REALTIME_EVENT_STAGES,
} from "./types";

export type { MemoryRealtimeEventInput } from "./types";

type ProjectionStore = Record<string, MemoryRealtimeProjection>;

const STAGE_BY_KIND: Record<MemoryRealtimeEventKind, MemoryRealtimeEventStage> = {
  source_synced: "source_sync",
  memory_extracted: "memory",
  experience_captured: "experience",
  skill_candidate_generated: "skill",
  skill_approved: "skill",
  agent_run_prepared: "execution",
  agent_run_started: "execution",
  agent_run_completed: "execution",
  outcome_recorded: "learning",
  future_instruction_created: "learning",
  brief_ready: "learning",
  projection_refreshed: "system",
  memory_processed: "memory",
  handoff_generated: "execution",
  resume_generated: "execution",
  timeline_updated: "system",
  request_logged: "source_sync",
  governance_review_queued: "governance",
  api_keys_changed: "governance",
  service_users_changed: "governance",
};

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isRealtimeEventKind(value: unknown): value is MemoryRealtimeEventKind {
  return (MEMORY_REALTIME_EVENT_KINDS as readonly string[]).includes(String(value));
}

function isRealtimeEventStage(value: unknown): value is MemoryRealtimeEventStage {
  return (MEMORY_REALTIME_EVENT_STAGES as readonly string[]).includes(String(value));
}

function normalizeSource(value: string): MemoryRealtimeEvent["source"] {
  if (
    value === "memory-router" ||
    value === "memory-ignition" ||
    value === "company-brain" ||
    value === "continuity" ||
    value === "request-logger" ||
    value === "system"
  ) {
    return value;
  }
  return "system";
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function summarizeEvent(event: MemoryRealtimeEvent): string {
  return (
    firstString(
      event.subject?.label,
      event.payload.summary,
      event.payload.message,
      event.payload.title,
      event.payload.kind,
      event.kind.replaceAll("_", " "),
    ) ?? event.kind
  );
}

function createEmptyCounts<T extends string>(values: readonly T[]): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

function rowToEvent(row: {
  id: string;
  userId: string;
  orgId: string | null;
  contractVersion: string;
  correlationId: string | null;
  causationId: string | null;
  traceId: string | null;
  kind: string;
  stage: string;
  source: string;
  subjectJson: string | null;
  payloadJson: string;
  occurredAt: string;
}): MemoryRealtimeEvent {
  const subject = safeParseJson<MemoryRealtimeSubject | null>(row.subjectJson, null);
  const payload = safeParseJson<Record<string, unknown>>(row.payloadJson, {});
  const kind = isRealtimeEventKind(row.kind) ? row.kind : "request_logged";
  return {
    id: row.id,
    userId: row.userId,
    orgId: row.orgId,
    contractVersion: row.contractVersion,
    correlationId: row.correlationId,
    causationId: row.causationId,
    traceId: row.traceId,
    kind,
    stage: isRealtimeEventStage(row.stage) ? row.stage : inferMemoryRealtimeStage(kind),
    source: normalizeSource(row.source),
    ...(subject ? { subject } : {}),
    payload,
    occurredAt: row.occurredAt,
  };
}

export function inferMemoryRealtimeStage(kind: MemoryRealtimeEventKind): MemoryRealtimeEventStage {
  return STAGE_BY_KIND[kind] ?? "system";
}

export function normalizeMemoryRealtimeEvent(input: MemoryRealtimeEventInput): MemoryRealtimeEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  return {
    id: input.id ?? randomUUID(),
    userId: input.userId,
    orgId: input.orgId ?? null,
    contractVersion: input.contractVersion ?? "epoch.event.v1",
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    traceId: input.traceId ?? null,
    kind: input.kind,
    stage: input.stage ?? inferMemoryRealtimeStage(input.kind),
    source: input.source ?? "memory-router",
    subject: input.subject,
    payload: input.payload ?? {},
    occurredAt,
  };
}

export function buildMemoryRealtimeProjection(events: MemoryRealtimeEvent[]): MemoryRealtimeProjection {
  const totalByKind = createEmptyCounts(MEMORY_REALTIME_EVENT_KINDS);
  const totalByStage = createEmptyCounts(MEMORY_REALTIME_EVENT_STAGES);

  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  for (const event of sorted) {
    totalByKind[event.kind] += 1;
    totalByStage[event.stage] += 1;
  }

  return {
    userId: sorted[0]?.userId ?? "",
    updatedAt: sorted[0]?.occurredAt ?? new Date().toISOString(),
    totalEvents: sorted.length,
    totalByKind,
    totalByStage,
    latestEventAt: sorted[0]?.occurredAt ?? null,
    latestEventId: sorted[0]?.id ?? null,
    recentEvents: sorted.slice(0, 20).map((event) => ({
      id: event.id,
      kind: event.kind,
      stage: event.stage,
      occurredAt: event.occurredAt,
      summary: summarizeEvent(event),
      ...(event.subject ? { subject: event.subject } : {}),
    })),
  };
}

export function rebuildMemoryRealtimeProjections(events: MemoryRealtimeEvent[]): ProjectionStore {
  const grouped = new Map<string, MemoryRealtimeEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.userId) ?? [];
    list.push(event);
    grouped.set(event.userId, list);
  }

  const projections: ProjectionStore = {};
  for (const [userId, userEvents] of grouped.entries()) {
    const projection = buildMemoryRealtimeProjection(userEvents);
    projections[userId] = {
      ...projection,
      userId,
    };
  }
  return projections;
}

export async function listMemoryRealtimeEvents(
  userId?: string,
  limit?: number,
): Promise<MemoryRealtimeEvent[]> {
  const normalizedLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(1, Math.floor(limit))
      : 1000;
  const rows = await prisma.memoryRealtimeEvent.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { occurredAt: "desc" },
    take: normalizedLimit,
  });
  return rows.map(rowToEvent);
}

export async function getMemoryRealtimeProjection(
  userId?: string,
): Promise<MemoryRealtimeProjection | null> {
  const events = await listMemoryRealtimeEvents(userId, 1000);
  if (events.length === 0) return null;
  return buildMemoryRealtimeProjection(events);
}

export async function appendMemoryRealtimeEvent(
  input: MemoryRealtimeEventInput,
): Promise<MemoryRealtimeEvent> {
  const event = normalizeMemoryRealtimeEvent(input);
  await prisma.memoryRealtimeEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      userId: event.userId,
      orgId: event.orgId ?? null,
      contractVersion: event.contractVersion,
      correlationId: event.correlationId ?? null,
      causationId: event.causationId ?? null,
      traceId: event.traceId ?? null,
      kind: event.kind,
      stage: event.stage,
      source: event.source,
      subjectJson: event.subject ? JSON.stringify(event.subject) : null,
      payloadJson: JSON.stringify(event.payload),
      occurredAt: event.occurredAt,
    },
    update: {
      userId: event.userId,
      orgId: event.orgId ?? null,
      contractVersion: event.contractVersion,
      correlationId: event.correlationId ?? null,
      causationId: event.causationId ?? null,
      traceId: event.traceId ?? null,
      kind: event.kind,
      stage: event.stage,
      source: event.source,
      subjectJson: event.subject ? JSON.stringify(event.subject) : null,
      payloadJson: JSON.stringify(event.payload),
      occurredAt: event.occurredAt,
    },
  });
  return event;
}

export async function resetMemoryRealtimeStoreForTests(): Promise<void> {
  await prisma.memoryRealtimeEvent.deleteMany();
}
