import { randomUUID } from "crypto";
import type { MemoryStoreSearchResult } from "../adapters/adapters";
import type { ScoredMemoryCandidate } from "../memory/scoreMemory";
import { MEMORY_CONTRACT_CATEGORIES, MEMORY_CONTRACT_VERSION } from "../memory/types";
import type {
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

  return {
    id: result.id,
    userId,
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
  };
}
