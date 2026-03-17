import { searchMemoryFromMem0, type Mem0SearchResult } from "../integrations/mem0";
import { getRecentMemories } from "./recentMemoryStore";
import type { Memory, MemoryType } from "./types";

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
    finalScore: number;
  }>;
}

// TODO: keep these as constants so tuning is easy later.
const WEIGHTS = {
  semantic: 0.4,
  typeRelevance: 0.25,
  importance: 0.2,
  recency: 0.15,
} as const;

// TODO: define question-intent -> preferred memory types.
const DEFAULT_MEMORY_TYPES: MemoryType[] = [
  "project",
  "learning",
  "preference",
  "profile",
  "episodic",
];

const INTENT_MEMORY_TYPES = {
  build_next: ["project", "learning", "profile"],
  stack_fit: ["preference", "project", "learning"],
  learning_path: ["learning", "project", "profile"],
} as const satisfies Record<string, readonly MemoryType[]>;


function inferPreferredTypes(question: string): MemoryType[] {
  const q = question.toLowerCase();

  let intent: keyof typeof INTENT_MEMORY_TYPES | null = null;

  if (q.includes("build") || q.includes("next") || q.includes("project")) {
    intent = "build_next";
  } else if (q.includes("stack") || q.includes("language") || q.includes("tech")) {
    intent = "stack_fit";
  } else if (q.includes("learn") || q.includes("study")) {
    intent = "learning_path";
  }

  return intent ? [...INTENT_MEMORY_TYPES[intent]] : DEFAULT_MEMORY_TYPES;
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

function parseMetadata(result: Mem0SearchResult): {
  memoryType?: MemoryType;
  importanceScore: number;
  updatedAt?: string;
} {
  const metadata = result?.metadata;

  let memoryType: MemoryType | undefined = undefined;
  let importanceScore = 0.5;
  let updatedAt: string | undefined = undefined;

  if (!metadata || typeof metadata !== "object") {
    return {
      memoryType,
      importanceScore,
      updatedAt,
    };
  }

  if (
    typeof metadata.type === "string" &&
    VALID_MEMORY_TYPES.includes(metadata.type as MemoryType)
  ) {
    memoryType = metadata.type as MemoryType;
  }

  importanceScore = parseNumericMetadataValue(metadata.importanceScore, 0.5);

  if (typeof metadata.updatedAt === "string") {
    updatedAt = metadata.updatedAt;
  }

  return {
    memoryType,
    importanceScore,
    updatedAt,
  };
}

// TODO: normalize Mem0 semantic score to 0..1.
// If missing, fallback to neutral value (e.g., 0.5).
function normalizeSemanticScore(rawScore?: number): number {
  if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
    return 0.5;
  }

  if (rawScore < 0) return 0;
  if (rawScore > 1) return 1;

  return rawScore;
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

// TODO: compute recency score from updatedAt.
// Suggested simple rule:
// - missing date => 0.5
// - <=7 days => 1.0
// - <=30 days => 0.8
// - <=90 days => 0.6
// - older => 0.4

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

// TODO: score type relevance based on preferred ordering.
// Suggested:
// - first preferred type => 1.0
// - second => 0.8
// - third => 0.6
// - other => 0.4
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

// TODO: compute weighted final score.
function computeFinalScore(input: {
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
}): number {
  return (
    input.semanticScore * WEIGHTS.semantic +
    input.typeRelevanceScore * WEIGHTS.typeRelevance +
    input.importanceScore * WEIGHTS.importance +
    input.recencyScore * WEIGHTS.recency
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

  const preferredTypes = inferPreferredTypes(input.question);

  const ranked: RankedMemory[] = candidates.map((item) => {
    const meta = parseMetadata(item);

    const semanticScore = normalizeSemanticScore(item.score);
    const typeRelevanceScore = getTypeRelevanceScore(
      meta.memoryType,
      preferredTypes,
    );
    const recencyScore = getRecencyScore(meta.updatedAt);

    const finalScore = computeFinalScore({
      semanticScore,
      typeRelevanceScore,
      importanceScore: meta.importanceScore,
      recencyScore,
    });

    return {
      ...item,
      memoryType: meta.memoryType,
      importanceScore: meta.importanceScore,
      recencyScore,
      typeRelevanceScore,
      semanticScore,
      finalScore,
      updatedAt: meta.updatedAt,
    };
  });

  // TODO: sort by finalScore descending.
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // TODO: return only requested topK (default 5).
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
      finalScore: m.finalScore,
    })),
  };
}
