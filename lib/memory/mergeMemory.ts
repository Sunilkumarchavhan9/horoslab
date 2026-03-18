import type { Memory } from "./types";

export interface MergeResult {
  shouldMerge: boolean;
  similarity: number;
  reason: string;
  mergedMemory?: Memory;
  baseMemory?:Memory;
}

const MERGE_SIMILARITY_THRESHOLD = 0.55;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(" ")
      .map((token) => {
        const normalizeToken = token.trim();
        if (normalizeToken.length > 4 && normalizeToken.endsWith("s")) {
          return normalizeToken.slice(0, -1);
        }
        return normalizeToken;
      })
      .filter(Boolean),
  );
}
function shareStrongKeyword(a: string, b: string): boolean{
  const STOP_WORD = new Set([
    "user",
    "is",
    "a",
    "an",
    "the",
    "to",
    "on",
    "with",
    "and",
    "of",
    "learning",
    "building",
    "working",
    "shipped",
    "deployed",
    "trained",
    "solved",
    "wants",
    "prefer",
    "prefers",
    "uses",
  ]);

  const aToken = [...tokenize(a)].filter((token) =>  !STOP_WORD.has(token));
  const bToken = [...tokenize(b)].filter((token) =>  !STOP_WORD.has(token));

  return aToken.some((token) => bToken.includes(token));
};


function jaccardSimilarity(a: string, b: string): number {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function chooseStrongerText(existingText: string, incomingText: string): string {
  const existing = normalize(existingText);
  const incoming = normalize(incomingText);

  if (incoming.includes(existing) && incoming.length >= existing.length) {
    return incomingText;
  }

  if (existing.includes(incoming) && existing.length >= incoming.length) {
    return existingText;
  }

  return incomingText.length >= existingText.length ? incomingText : existingText;
}

export function mergeMemory(existing: Memory, incoming: Memory): MergeResult {
  if (existing.userId !== incoming.userId) {
    return {
      shouldMerge: false,
      similarity: 0,
      reason: "different users",
    };
  }

  if (existing.type !== incoming.type) {
    return {
      shouldMerge: false,
      similarity: 0,
      reason: "different memory types",
    };
  }

  const similarity = jaccardSimilarity(existing.content, incoming.content);
  const existingNormalized = normalize(existing.content);
  const incomingNormalized = normalize(incoming.content);

  const containsRelation = existingNormalized.includes(incomingNormalized) || incomingNormalized.includes(existingNormalized);
  const strongKeywordOverlap = shareStrongKeyword(
    existing.content,
    incoming.content,
  )

  if ((similarity < MERGE_SIMILARITY_THRESHOLD && !containsRelation) || !strongKeywordOverlap) {
    return {
      shouldMerge: false,
      similarity,
      reason: !strongKeywordOverlap ? "no strong keyword overlap" : "similarity below merge threshold",
    };
  }


  const mergedMemory: Memory = { 
    ...existing,
    content: chooseStrongerText(existing.content, incoming.content),
    summary: chooseStrongerText(existing.summary, incoming.summary),
    importanceScore: Math.max(existing.importanceScore, incoming.importanceScore),
    confidence: Math.max(existing.confidence, incoming.confidence),
    evidenceCount: existing.evidenceCount + incoming.evidenceCount,
    updatedAt: new Date().toISOString(),
    status: "active",
  };
  return {
    shouldMerge: true,
    similarity,
    reason: containsRelation
      ? "one memory contains the other"
      : "same type with high similarity",
    mergedMemory,
    baseMemory: existing,
  };
}
