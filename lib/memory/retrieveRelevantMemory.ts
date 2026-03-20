import { searchMemoryFromMem0, type Mem0SearchResult } from "../integrations/mem0";
import { getRecentMemories } from "./recentMemoryStore";
import type { Memory, MemoryType } from "./types";
import { MEMORY_RULES, type RetrievalIntent } from "../config/memoryRules";

export interface RetrieveRelevantMemoryInput {
  userId: string;
  question: string;
  topK?: number; // how many final memories to return
}

export interface RankedMemory extends Mem0SearchResult {
  memoryType?: MemoryType;
  importanceScore: number; // 0..1
  recencyScore: number; // 0..1
  typeRelevanceScore: number; // 0..1
  semanticScore: number; // 0..1 (from Mem0 score)
  continuityBoost: number;
  finalScore: number; // weighted score
  updatedAt?: string;
}

export interface RetrieveRelevantMemoryResult {
  memories: RankedMemory[];
  debug: Array<{
    id: string;
    semanticScore: number;
    typeRelevanceScore: number;
    importanceScore: number;
    recencyScore: number;
    continuityBoost: number;
    intent: RetrievalIntent;
    finalScore: number;
  }>;
}

const DEFAULT_MEMORY_TYPES: MemoryType[] = [
  "project",
  "learning",
  "preference",
  "profile",
  "episodic",
];

const INTENT_MEMORY_TYPES = {
  build_next: ["project", "learning", "profile", "preference", "episodic"],
  stack_fit: ["preference", "project", "learning", "profile", "episodic"],
  study_next: ["learning", "project", "profile", "preference", "episodic"],
  resume_project: ["project", "episodic", "profile", "learning", "preference"],
  bug_recall: ["episodic", "project", "preference", "learning", "profile"],
  backend_fit: ["episodic", "project", "preference", "learning", "profile"],
  general: DEFAULT_MEMORY_TYPES,
} as const satisfies Record<string, readonly MemoryType[]>;

function detectQuestionIntent(question: string): RetrievalIntent {
  const q = question.toLowerCase();

  if (
    q.includes("resume") ||
    q.includes("left off") ||
    q.includes("pick up")
  ) {
    return "resume_project";
  }

  if (
    (q.includes("solved") && q.includes("before")) ||
    q.includes("similar bug") ||
    q.includes("similar issue") ||
    q.includes("like this bug")
  ) {
    return "bug_recall";
  }

  if (
    q.includes("backend work") ||
    q.includes("backend role") ||
    q.includes("kind of backend")
  ) {
    return "backend_fit";
  }

  if (q.includes("stack") || q.includes("language") || q.includes("tech")) {
    return "stack_fit";
  }

  if (
    q.includes("study") ||
    q.includes("learn this week") ||
    q.includes("learn next")
  ) {
    return "study_next";
  }

  if (
    q.includes("build next") ||
    q.includes("what should i build") ||
    (q.includes("build") && q.includes("next")) ||
    q.includes("next project")
  ) {
    return "build_next";
  }

  return "general";
}

function inferPreferredTypes(intent: RetrievalIntent): MemoryType[] {
  return [...INTENT_MEMORY_TYPES[intent]];
}

const VALID_MEMORY_TYPES: MemoryType[] = [
  "project",
  "learning",
  "preference",
  "profile",
  "episodic",
];

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

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function computeLexicalSimilarity(a: string, b: string): number {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0.5;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0.5 : intersection / union;
}

function memoryToSearchResult(memory: Memory, question: string): Mem0SearchResult {
  return {
    id: memory.id,
    memory: memory.content,
    score: computeLexicalSimilarity(question, memory.content),
    metadata: {
      memoryId: memory.id,
      type: memory.type,
      summary: memory.summary,
      importanceScore: String(memory.importanceScore),
      confidence: String(memory.confidence),
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: String(memory.evidenceCount),
    },
  };
}

function parseMetadata(result: Mem0SearchResult): {
  memoryType?: MemoryType;
  importanceScore: number;
  updatedAt?: string;
  evidenceCount: number;
} {
  const metadata = result?.metadata;

  let memoryType: MemoryType | undefined = undefined;
  let importanceScore = 0.5;
  let updatedAt: string | undefined = undefined;
  let evidenceCount = 1;

  if (!metadata || typeof metadata !== "object") {
    return {
      memoryType,
      importanceScore,
      updatedAt,
      evidenceCount,
    };
  }

  if (
    typeof metadata.type === "string" &&
    VALID_MEMORY_TYPES.includes(metadata.type as MemoryType)
  ) {
    memoryType = metadata.type as MemoryType;
  }

  if (
    "importanceScore" in metadata
  ) {
    importanceScore = parseNumericMetadataValue(metadata.importanceScore, 0.5);
  }

  if (typeof metadata.updatedAt === "string") {
    updatedAt = metadata.updatedAt;
  }

  if ("evidenceCount" in metadata) {
    evidenceCount = Math.max(
      1,
      Math.round(parseNumericMetadataValue(metadata.evidenceCount, 1)),
    );
  }

  return {
    memoryType,
    importanceScore,
    updatedAt,
    evidenceCount,
  };
}

function normalizeSemanticScore(rawScore?: number): number {
  if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
    return 0.5;
  }

  if (rawScore < 0) return 0;
  if (rawScore > 1) return 1;

  return rawScore;
}

function getRecencyScore(updatedAt?: string): number {
  if (!updatedAt) {
    return 0.5;
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return 0.5;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) return 1.0;
  if (diffDays <= 30) return 0.8;
  if (diffDays <= 90) return 0.6;

  return 0.4;
}

function getTypeRelevanceScore(
  memoryType: MemoryType | undefined,
  preferredTypes: MemoryType[],
): number {
  if (!memoryType) {
    return 0.4;
  }

  const index = preferredTypes.indexOf(memoryType);

  if (index === -1) return 0.4;
  if (index === 0) return 1.0;
  if (index === 1) return 0.8;
  if (index === 2) return 0.6;

  return 0.4;
}

function getIntentTypeBoost(
  intent: RetrievalIntent,
  memoryType: MemoryType | undefined,
): number {
  if (!memoryType) {
    return 0;
  }

  return MEMORY_RULES.retrieval.intentTypeBoosts[intent][memoryType] ?? 0;
}

function getContinuityBoost(input: {
  intent: RetrievalIntent;
  memoryType: MemoryType | undefined;
  evidenceCount: number;
  recencyScore: number;
}): number {
  const intentTypeBoost = getIntentTypeBoost(input.intent, input.memoryType);
  const evidenceBoost = Math.min(
    MEMORY_RULES.retrieval.evidenceBoostMax,
    Math.max(0, input.evidenceCount - 1) *
      MEMORY_RULES.retrieval.evidenceBoostPerHit,
  );
  const freshnessBoost =
    input.recencyScore >= MEMORY_RULES.retrieval.freshnessBoostThreshold
      ? MEMORY_RULES.retrieval.freshnessBoostValue
      : 0;
  const resumeBoost =
    input.intent === "resume_project" && input.memoryType === "project"
      ? MEMORY_RULES.retrieval.resumeProjectBoost
      : 0;

  return intentTypeBoost + evidenceBoost + freshnessBoost + resumeBoost;
}

function computeFinalScore(input: {
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
}): number {
  const weights = MEMORY_RULES.retrieval.weights;
  return (
    input.semanticScore * weights.semantic +
    input.typeRelevanceScore * weights.typeRelevance +
    input.importanceScore * weights.importance +
    input.recencyScore * weights.recency +
    input.continuityBoost
  );
}


export async function retrieveRelevantMemory( input: RetrieveRelevantMemoryInput ): Promise<RetrieveRelevantMemoryResult> {
  const mem0Candidates = await searchMemoryFromMem0({
    userId: input.userId,
    query: input.question,
    topK: Math.max(input.topK ?? 10, 10), // fetch wider candidate set first
  });
  const recentCandidates = getRecentMemories(input.userId).map((memory) =>
    memoryToSearchResult(memory, input.question),
  );
  const candidates = Array.from(
    new Map(
      [...recentCandidates, ...mem0Candidates].map((item) => [
        item.metadata?.memoryId ?? item.id,
        item,
      ]),
    ).values(),
  );

  const intent = detectQuestionIntent(input.question);
  const preferredTypes = inferPreferredTypes(intent);

  const ranked: RankedMemory[] = candidates.map((item) => {
    const meta = parseMetadata(item);

    const semanticScore = normalizeSemanticScore(item.score);
    const typeRelevanceScore = getTypeRelevanceScore(
      meta.memoryType,
      preferredTypes,
    );
    const recencyScore = getRecencyScore(meta.updatedAt);
    const continuityBoost = getContinuityBoost({
      intent,
      memoryType: meta.memoryType,
      evidenceCount: meta.evidenceCount,
      recencyScore,
    });

    const finalScore = computeFinalScore({
      semanticScore,
      typeRelevanceScore,
      importanceScore: meta.importanceScore,
      recencyScore,
      continuityBoost,
    });

    return {
      ...item,
      memoryType: meta.memoryType,
      importanceScore: meta.importanceScore,
      recencyScore,
      typeRelevanceScore,
      semanticScore,
      continuityBoost,
      finalScore,
      updatedAt: meta.updatedAt,
    };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  const finalTopK = input.topK ?? 5;
  const top = ranked.slice(0, finalTopK);

  return {
    memories: top,
    debug: top.map((m) => ({
      id: m.id,
      semanticScore: m.semanticScore,
      typeRelevanceScore: m.typeRelevanceScore,
      importanceScore: m.importanceScore,
      recencyScore: m.recencyScore,
      continuityBoost: m.continuityBoost,
      intent,
      finalScore: m.finalScore,
    })),
  };
}
