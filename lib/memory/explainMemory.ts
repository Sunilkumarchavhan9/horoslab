import { getMemoryById } from "../integrations/mem0";
import { listRevisionEvents } from "./revisionMemory";
import { listTimelineEvents } from "./timelineMemory";
import type { MemorySource, MemoryStatus, MemoryType, RevisionEvent, TimelineEvent } from "./types";

const ALLOWED_TYPES: MemoryType[] = [
  "profile",
  "preference",
  "learning",
  "project",
  "episodic",
];
const ALLOWED_SOURCES: MemorySource[] = ["chat", "system", "import"];
const ALLOWED_STATUSES: MemoryStatus[] = ["active", "archived", "merged"];

export interface ExplainMemoryInput {
  memoryId: string;
  userId?: string;
}

export interface ExplainMemoryResult {
  memory: {
    id: string;
    content: string;
    type?: MemoryType;
    summary?: string;
    source?: MemorySource;
    status?: MemoryStatus;
    importanceScore: number;
    confidence: number;
    evidenceCount: number;
    createdAt?: string;
    updatedAt?: string;
    rawMetadata: Record<string, unknown>;
  };
  latestRevision: RevisionEvent | null;
  timeline: TimelineEvent[];
  explanation: {
    whySaved: string;
    importanceScore: number;
    confidence: number;
    evidenceCount: number;
    lastUpdatedAt: string;
  };
}

function parseNumericMetadataValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function safeIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function sortByTimestampAsc(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return aTime - bTime;
  });
}

function getLatestRevision(revisions: RevisionEvent[]): RevisionEvent | null {
  if (revisions.length === 0) {
    return null;
  }

  return [...revisions].sort((a, b) => {
    const aTime = new Date(a.changedAt).getTime();
    const bTime = new Date(b.changedAt).getTime();
    return bTime - aTime;
  })[0] ?? null;
}

export async function explainMemory(
  input: ExplainMemoryInput,
): Promise<ExplainMemoryResult | null> {
  const memory = await getMemoryById({ id: input.memoryId });
  if (!memory) {
    return null;
  }

  const metadata =
    memory.metadata && typeof memory.metadata === "object"
      ? (memory.metadata as Record<string, unknown>)
      : {};

  const type =
    typeof metadata.type === "string" &&
    ALLOWED_TYPES.includes(metadata.type as MemoryType)
      ? (metadata.type as MemoryType)
      : undefined;
  const source =
    typeof metadata.source === "string" &&
    ALLOWED_SOURCES.includes(metadata.source as MemorySource)
      ? (metadata.source as MemorySource)
      : undefined;
  const status =
    typeof metadata.status === "string" &&
    ALLOWED_STATUSES.includes(metadata.status as MemoryStatus)
      ? (metadata.status as MemoryStatus)
      : undefined;
  const summary =
    typeof metadata.summary === "string" ? metadata.summary : undefined;
  const createdAt = safeIsoDate(metadata.createdAt);
  const updatedAt = safeIsoDate(metadata.updatedAt);

  const importanceScore = parseNumericMetadataValue(metadata.importanceScore, 0.5);
  const confidence = parseNumericMetadataValue(metadata.confidence, 0.5);
  const evidenceCount = Math.max(
    1,
    Math.round(parseNumericMetadataValue(metadata.evidenceCount, 1)),
  );

  const revisions = listRevisionEvents({ memoryId: input.memoryId });
  const latestRevision = getLatestRevision(revisions);

  const timeline = sortByTimestampAsc(
    listTimelineEvents(input.userId).filter((event) => event.memoryId === input.memoryId),
  );

  const whySaved =
    latestRevision?.reason ??
    timeline[timeline.length - 1]?.reason ??
    "Memory exists in store; no revision reason available yet";

  return {
    memory: {
      id: memory.id,
      content: memory.memory ?? "",
      type,
      summary,
      source,
      status,
      importanceScore,
      confidence,
      evidenceCount,
      createdAt,
      updatedAt,
      rawMetadata: metadata,
    },
    latestRevision,
    timeline,
    explanation: {
      whySaved,
      importanceScore,
      confidence,
      evidenceCount,
      lastUpdatedAt: updatedAt ?? new Date().toISOString(),
    },
  };
}
