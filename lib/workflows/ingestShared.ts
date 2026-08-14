import { randomUUID } from "crypto";
import type { MemoryStoreSearchResult } from "../adapters/adapters";
import type { ScoredMemoryCandidate } from "../memory/scoreMemory";
import { COMPANY_BRAIN_MEMORY_TYPES, MEMORY_CONTRACT_CATEGORIES, MEMORY_CONTRACT_VERSION } from "../memory/types";
import type {
  CompanyBrainConflict,
  CompanyBrainProofQuality,
  CompanyBrainRelation,
  CompanyBrainResolvedEntity,
  CompanyBrainFreshness,
  CompanyBrainGraph,
  CompanyBrainMemoryType,
  CompanyBrainTraceProof,
  DeveloperSignals,
  Memory,
  MemoryContractCategory,
  OperationalTag,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from "../memory/types";

const ALLOWED_TYPES: MemoryType[] = [
  "profile",
  "preference",
  "learning",
  "project",
  "episodic",
];

const ALLOWED_SOURCES: MemorySource[] = ["chat", "system", "import"];
const ALLOWED_STATUSES: MemoryStatus[] = [
  "active",
  "stale",
  "contradicted",
  "archived",
  "merged",
];


export function  parseNumericMetadataValue(value:unknown, fallback:number): number{
  if(typeof value === "number" && !Number.isNaN(value)){
    return value;
  }

  if(typeof value === "string"){
    const parsed = Number(value);
    if(!Number.isNaN(parsed)){
        return parsed;
    }
  }
  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseDeveloperSignals(value: unknown): DeveloperSignals | undefined {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const record = raw as Record<string, unknown>;

  const signals: DeveloperSignals = {
    stack: toStringArray(record.stack),
    framework: toStringArray(record.framework),
    bugType: toStringArray(record.bugType),
    goal: toStringArray(record.goal),
    projectArea: toStringArray(record.projectArea),
  };

  const hasAny =
    (signals.stack?.length ?? 0) > 0 ||
    (signals.framework?.length ?? 0) > 0 ||
    (signals.bugType?.length ?? 0) > 0 ||
    (signals.goal?.length ?? 0) > 0 ||
    (signals.projectArea?.length ?? 0) > 0;

  return hasAny ? signals : undefined;
}

function parseOperationalTags(value: unknown): OperationalTag[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const allowed: OperationalTag[] = ["decision", "policy", "incident", "runbook"];
  const parsed = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is OperationalTag => allowed.includes(item as OperationalTag));
  return parsed.length > 0 ? Array.from(new Set(parsed)) : undefined;
}

function parseCompanyBrainType(value: unknown): CompanyBrainMemoryType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return COMPANY_BRAIN_MEMORY_TYPES.includes(normalized as CompanyBrainMemoryType)
    ? normalized as CompanyBrainMemoryType
    : undefined;
}

function parseRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function parseTraceProof(value: unknown): CompanyBrainTraceProof | undefined {
  const record = parseRecord(value);
  if (!record) return undefined;
  const sourceType = typeof record.sourceType === "string" ? record.sourceType : undefined;
  const sourceRef = typeof record.sourceRef === "string" ? record.sourceRef : undefined;
  const capturedAt = typeof record.capturedAt === "string" ? record.capturedAt : undefined;
  if (!sourceType || !sourceRef || !capturedAt) return undefined;
  return {
    sourceType,
    sourceRef,
    evidence: toStringArray(record.evidence),
    confidence: parseNumericMetadataValue(record.confidence, 0.5),
    capturedAt,
  };
}

function parseFreshness(value: unknown): CompanyBrainFreshness | undefined {
  const record = parseRecord(value);
  if (!record) return undefined;
  const status = record.status === "fresh" || record.status === "aging" || record.status === "stale"
    ? record.status
    : undefined;
  const checkedAt = typeof record.checkedAt === "string" ? record.checkedAt : undefined;
  return status && checkedAt ? { status, checkedAt } : undefined;
}

function parseConflict(value: unknown): CompanyBrainConflict | undefined {
  const record = parseRecord(value);
  if (!record) return undefined;
  const status = record.status === "none" || record.status === "possible_conflict" ? record.status : undefined;
  const checkedAt = typeof record.checkedAt === "string" ? record.checkedAt : undefined;
  return status && checkedAt
    ? { status, checkedAt, conflictsWith: toStringArray(record.conflictsWith) }
    : undefined;
}

function parseGraph(value: unknown): CompanyBrainGraph | undefined {
  const record = parseRecord(value);
  if (!record) return undefined;
  const nodeId = typeof record.nodeId === "string" ? record.nodeId : undefined;
  const nodeType = parseCompanyBrainType(record.nodeType);
  return nodeId && nodeType
    ? { nodeId, nodeType, edgeRefs: toStringArray(record.edgeRefs) }
    : undefined;
}

function parseResolvedEntities(value: unknown): CompanyBrainResolvedEntity[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entities = value.flatMap((item): CompanyBrainResolvedEntity[] => {
    const record = parseRecord(item);
    if (!record) return [];
    const id = typeof record.id === "string" ? record.id : undefined;
    const kind = typeof record.kind === "string" ? record.kind : undefined;
    const label = typeof record.label === "string" ? record.label : undefined;
    const canonicalId = typeof record.canonicalId === "string" ? record.canonicalId : undefined;
    const latestMemoryAt = typeof record.latestMemoryAt === "string" ? record.latestMemoryAt : undefined;
    if (!id || !kind || !label || !canonicalId || !latestMemoryAt) return [];
    return [{
      id,
      kind: kind as CompanyBrainResolvedEntity["kind"],
      label,
      canonicalId,
      aliases: toStringArray(record.aliases),
      references: toStringArray(record.references),
      evidenceCount: Math.max(1, Math.round(parseNumericMetadataValue(record.evidenceCount, 1))),
      memoryIds: toStringArray(record.memoryIds),
      latestMemoryAt,
      confidence: parseNumericMetadataValue(record.confidence, 0.5),
    }];
  });
  return entities.length > 0 ? entities : undefined;
}

function parseRelations(value: unknown): CompanyBrainRelation[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const relations = value.flatMap((item): CompanyBrainRelation[] => {
    const record = parseRecord(item);
    if (!record) return [];
    const id = typeof record.id === "string" ? record.id : undefined;
    const fromEntityId = typeof record.fromEntityId === "string" ? record.fromEntityId : undefined;
    const toEntityId = typeof record.toEntityId === "string" ? record.toEntityId : undefined;
    const relationType = typeof record.relationType === "string" ? record.relationType : undefined;
    if (!id || !fromEntityId || !toEntityId || !relationType) return [];
    return [{
      id,
      fromEntityId,
      toEntityId,
      relationType: relationType as CompanyBrainRelation["relationType"],
      evidenceRefs: toStringArray(record.evidenceRefs),
      memoryIds: toStringArray(record.memoryIds),
      confidence: parseNumericMetadataValue(record.confidence, 0.5),
    }];
  });
  return relations.length > 0 ? relations : undefined;
}

function parseProofQuality(value: unknown): CompanyBrainProofQuality | undefined {
  const record = parseRecord(value);
  if (!record) return undefined;
  const status =
    record.status === "strong" || record.status === "usable" || record.status === "weak" || record.status === "blocked"
      ? record.status
      : undefined;
  const assessedAt = typeof record.assessedAt === "string" ? record.assessedAt : undefined;
  if (!status || !assessedAt) return undefined;
  return {
    score: Math.max(0, Math.min(100, Math.round(parseNumericMetadataValue(record.score, 0)))),
    status,
    productionReady: record.productionReady === true,
    reasons: toStringArray(record.reasons),
    gaps: toStringArray(record.gaps),
    assessedAt,
  };
}

function parseContractCategory(value: unknown): MemoryContractCategory | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return MEMORY_CONTRACT_CATEGORIES.includes(normalized as MemoryContractCategory)
    ? normalized as MemoryContractCategory
    : undefined;
}

export function toMemory(candidate: ScoredMemoryCandidate): Memory{
    const now  =  new Date().toISOString();

    return{
        id: randomUUID(),
        userId: candidate.userId,
        type: candidate.type,
        content: candidate.content,
        summary: candidate.summary,
        importanceScore: candidate.importanceScore,
        confidence: candidate.confidence,
        source: candidate.source,
        status: "active",
        createdAt: now,
        updatedAt: now,
        evidenceCount: 1,
        contractVersion: candidate.contractCategory ? MEMORY_CONTRACT_VERSION : candidate.contractVersion,
        contractCategory: candidate.contractCategory,
        developerSignals: candidate.developerSignals,
        operationalTags: candidate.operationalTags,
        ...(candidate.sourceRef ? { sourceRef: candidate.sourceRef } : {}),
        ...(candidate.files?.length ? { files: candidate.files } : {}),
    }
}




export function toInternalMemory(
  result: MemoryStoreSearchResult,
  userId: string,
): Memory | null {
  const metadata = result.metadata;
  const content = result.memory;

  if (!content) return null;
  if (!metadata || typeof metadata !== "object") return null;

  const rawType =
    typeof metadata.type === "string" ? metadata.type : undefined;
  const summary =
    typeof metadata.summary === "string" ? metadata.summary : undefined;
  const source =
    typeof metadata.source === "string" ? metadata.source : undefined;
  const status =
    typeof metadata.status === "string" ? metadata.status : undefined;
  const createdAt =
    typeof metadata.createdAt === "string" ? metadata.createdAt : undefined;
  const updatedAt =
    typeof metadata.updatedAt === "string" ? metadata.updatedAt : undefined;

  if (!rawType || !ALLOWED_TYPES.includes(rawType as MemoryType)) {
    return null;
  }

  if (!source || !ALLOWED_SOURCES.includes(source as MemorySource)) {
    return null;
  }

  if (!status || !ALLOWED_STATUSES.includes(status as MemoryStatus)) {
    return null;
  }

  if (!summary || !createdAt || !updatedAt) {
    return null;
  }

  const importanceScore = parseNumericMetadataValue(
    metadata.importanceScore,
    0.5,
  );
  const confidence = parseNumericMetadataValue(metadata.confidence, 0.5);
  const evidenceCount = Math.max( 1, Math.round(parseNumericMetadataValue(metadata.evidenceCount, 1)),);
  const contractCategory = parseContractCategory(metadata.contractCategory);
  const developerSignals = parseDeveloperSignals(metadata.developerSignals);
  const operationalTags = parseOperationalTags(metadata.operationalTags);
  const companyBrainType = parseCompanyBrainType(metadata.companyBrainType);
  const traceProof = parseTraceProof(metadata.traceProof);
  const freshness = parseFreshness(metadata.freshness);
  const conflict = parseConflict(metadata.conflict);
  const graph = parseGraph(metadata.graph);
  const entities = parseResolvedEntities(metadata.entities);
  const relations = parseRelations(metadata.relations);
  const proofQuality = parseProofQuality(metadata.proofQuality);
  const sourceRef = typeof metadata.sourceRef === "string" ? metadata.sourceRef.trim() : undefined;
  const files = toStringArray(metadata.files);
  const orgId =
    typeof metadata.orgId === "string"
      ? metadata.orgId
      : typeof metadata.org_id === "string"
        ? metadata.org_id
        : undefined;

  return {
    id: result.id,
    userId,
    ...(orgId ? { orgId } : {}),
    type: rawType as MemoryType,
    content,
    summary,
    importanceScore,
    confidence,
    source: source as MemorySource,
    status: status as MemoryStatus,
    createdAt,
    updatedAt,
    evidenceCount,
    contractVersion: contractCategory ? MEMORY_CONTRACT_VERSION : undefined,
    contractCategory,
    developerSignals,
    operationalTags,
    companyBrainType,
    traceProof,
    freshness,
    conflict,
    graph,
    ...(entities ? { entities } : {}),
    ...(relations ? { relations } : {}),
    ...(proofQuality ? { proofQuality } : {}),
    ...(sourceRef ? { sourceRef } : {}),
    ...(files.length > 0 ? { files } : {}),
  };
}
