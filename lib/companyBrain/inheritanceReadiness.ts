import type { Memory } from "../memory/types";

export type InheritanceReadinessStatus = "ready" | "review" | "blocked";

export type InheritanceReadinessStepId =
  | "source"
  | "source_permissions"
  | "memory"
  | "evidence"
  | "contract"
  | "freshness"
  | "conflict"
  | "graph"
  | "brief";

export interface InheritanceReadinessStep {
  id: InheritanceReadinessStepId;
  label: string;
  ok: boolean;
  detail: string;
}

export interface InheritanceReadinessMemoryInput {
  id?: string | null;
  content?: string | null;
  summary?: string | null;
  sourceRef?: string | null;
  source_ref?: string | null;
  type?: string | null;
  memoryType?: string | null;
  memory_type?: string | null;
  contractCategory?: string | null;
  contract_category?: string | null;
  companyBrainType?: string | null;
  finalScore?: number | null;
  final_score?: number | null;
  confidence?: number | null;
  status?: string | null;
  traceProof?: {
    sourceRef?: string | null;
    evidence?: string[] | null;
    confidence?: number | null;
  } | null;
  freshness?: {
    status?: string | null;
  } | null;
  conflict?: {
    status?: string | null;
  } | null;
  graph?: {
    nodeId?: string | null;
    edgeRefs?: string[] | null;
  } | null;
  entities?: unknown[] | null;
  relations?: unknown[] | null;
  proofQuality?: {
    productionReady?: boolean | null;
    status?: string | null;
  } | null;
  evidenceCount?: number | null;
}

export interface InheritanceReadinessTraceInput {
  memory_id?: string | null;
  source_ref?: string | null;
  sourceRef?: string | null;
  source_type?: string | null;
  sourceType?: string | null;
  confidence?: number | null;
  reason_tags?: string[] | null;
  files?: string[] | null;
}

export interface MemoryInheritanceReadiness {
  memoryId: string;
  sourceRef: string | null;
  status: InheritanceReadinessStatus;
  readyCount: number;
  totalCount: number;
  readyRatio: number;
  nextAction: string;
  steps: InheritanceReadinessStep[];
}

export interface InheritanceReadinessSummary {
  version: "inheritance_readiness.v1";
  total: number;
  ready: number;
  review: number;
  blocked: number;
  readyRatio: number;
  status: InheritanceReadinessStatus;
  nextActions: string[];
  memories: MemoryInheritanceReadiness[];
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function sourceRefFor(memory: InheritanceReadinessMemoryInput, trace?: InheritanceReadinessTraceInput): string | null {
  return (
    text(trace?.source_ref) ??
    text(trace?.sourceRef) ??
    text(memory.traceProof?.sourceRef) ??
    text(memory.sourceRef) ??
    text(memory.source_ref)
  );
}

function contractFor(memory: InheritanceReadinessMemoryInput): string | null {
  return (
    text(memory.companyBrainType) ??
    text(memory.contractCategory) ??
    text(memory.contract_category) ??
    text(memory.memoryType) ??
    text(memory.memory_type) ??
    text(memory.type)
  );
}

function scoreFor(memory: InheritanceReadinessMemoryInput, trace?: InheritanceReadinessTraceInput): number {
  const candidates = [
    memory.confidence,
    memory.finalScore,
    memory.final_score,
    memory.traceProof?.confidence,
    trace?.confidence,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return candidates.length ? Math.max(...candidates) : 0;
}

function evidenceCountFor(memory: InheritanceReadinessMemoryInput, trace?: InheritanceReadinessTraceInput): number {
  return Math.max(
    Array.isArray(memory.traceProof?.evidence) ? memory.traceProof?.evidence?.length ?? 0 : 0,
    typeof memory.evidenceCount === "number" ? memory.evidenceCount : 0,
    trace?.source_ref || trace?.sourceRef ? 1 : 0,
    Array.isArray(trace?.reason_tags) ? trace.reason_tags.length : 0,
  );
}

export function buildGenericMemoryInheritanceReadiness(
  memory: InheritanceReadinessMemoryInput,
  trace?: InheritanceReadinessTraceInput,
): MemoryInheritanceReadiness {
  const memoryId = text(memory.id) ?? "unknown-memory";
  const sourceRef = sourceRefFor(memory, trace);
  const contract = contractFor(memory);
  const score = scoreFor(memory, trace);
  const evidenceCount = evidenceCountFor(memory, trace);
  const freshnessStatus = text(memory.freshness?.status) ?? "unknown";
  const conflictStatus = text(memory.conflict?.status) ?? "clear";
  const stale = freshnessStatus === "stale" || memory.status === "stale";
  const conflicted = conflictStatus === "possible_conflict" || conflictStatus === "contradicted" || memory.status === "contradicted";
  const graphRefs = memory.graph?.edgeRefs ?? [];
  const graphReady = Boolean(memory.graph?.nodeId || graphRefs.length > 0 || (memory.entities?.length ?? 0) > 0 || (memory.relations?.length ?? 0) > 0);
  const proofReady = memory.proofQuality?.productionReady === true || memory.proofQuality?.status === "strong" || memory.proofQuality?.status === "usable";
  const briefReady = Boolean(sourceRef && memoryId !== "unknown-memory" && contract && evidenceCount > 0 && !stale && !conflicted && (proofReady || score >= 0.55));

  const steps: InheritanceReadinessStep[] = [
    {
      id: "source",
      label: "Source",
      ok: Boolean(sourceRef),
      detail: sourceRef ?? "Missing source reference",
    },
    {
      id: "memory",
      label: "Memory",
      ok: memoryId !== "unknown-memory",
      detail: memoryId,
    },
    {
      id: "evidence",
      label: "Evidence",
      ok: evidenceCount > 0,
      detail: evidenceCount > 0 ? `${evidenceCount} evidence signal${evidenceCount === 1 ? "" : "s"}` : "Missing source evidence",
    },
    {
      id: "contract",
      label: "Contract",
      ok: Boolean(contract),
      detail: contract ?? "Missing memory contract type",
    },
    {
      id: "freshness",
      label: "Freshness",
      ok: !stale,
      detail: stale ? "Stale memory blocks inheritance" : freshnessStatus,
    },
    {
      id: "conflict",
      label: "Conflict",
      ok: !conflicted,
      detail: conflicted ? "Conflict review required" : conflictStatus,
    },
    {
      id: "graph",
      label: "Graph",
      ok: graphReady,
      detail: graphReady ? "Graph or entity lineage present" : "Graph lineage missing",
    },
    {
      id: "brief",
      label: "Brief",
      ok: briefReady,
      detail: briefReady ? "Ready for MemoryIgnition inheritance" : "Review before future-agent inheritance",
    },
  ];

  const readyCount = steps.filter((step) => step.ok).length;
  const firstGap = steps.find((step) => !step.ok);
  const status: InheritanceReadinessStatus = briefReady
    ? "ready"
    : !sourceRef || memoryId === "unknown-memory" || stale || conflicted
      ? "blocked"
      : "review";

  return {
    memoryId,
    sourceRef,
    status,
    readyCount,
    totalCount: steps.length,
    readyRatio: pct(readyCount, steps.length),
    nextAction: firstGap ? `${firstGap.label}: ${firstGap.detail}` : "Ready for future-agent inheritance",
    steps,
  };
}

export function summarizeGenericMemoryInheritanceReadiness(
  memories: InheritanceReadinessMemoryInput[],
  traces: InheritanceReadinessTraceInput[] = [],
  options: { limit?: number } = {},
): InheritanceReadinessSummary {
  const traceByMemory = new Map(
    traces
      .filter((trace) => text(trace.memory_id))
      .map((trace) => [text(trace.memory_id) as string, trace]),
  );
  const readiness = memories.map((memory) =>
    buildGenericMemoryInheritanceReadiness(memory, traceByMemory.get(text(memory.id) ?? "")),
  );
  const ready = readiness.filter((item) => item.status === "ready").length;
  const review = readiness.filter((item) => item.status === "review").length;
  const blocked = readiness.filter((item) => item.status === "blocked").length;
  const nextActions = Array.from(new Set(
    readiness
      .filter((item) => item.status !== "ready")
      .map((item) => item.nextAction)
      .filter(Boolean),
  )).slice(0, 6);

  return {
    version: "inheritance_readiness.v1",
    total: readiness.length,
    ready,
    review,
    blocked,
    readyRatio: pct(ready, readiness.length),
    status: readiness.length === 0 || blocked > 0 ? "blocked" : review > 0 ? "review" : "ready",
    nextActions: nextActions.length ? nextActions : ["Ready memories can be inherited by MemoryIgnition."],
    memories: readiness.slice(0, options.limit ?? readiness.length),
  };
}

export function summarizeMemoryInheritanceReadiness(
  memories: Memory[],
  options: { limit?: number } = {},
): InheritanceReadinessSummary {
  return summarizeGenericMemoryInheritanceReadiness(memories, [], options);
}
