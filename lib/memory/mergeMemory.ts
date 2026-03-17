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
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

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

  const containsRelation =
    existingNormalized.includes(incomingNormalized) ||
    incomingNormalized.includes(existingNormalized);

  if (similarity < MERGE_SIMILARITY_THRESHOLD && !containsRelation) {
    return {
      shouldMerge: false,
      similarity,
      reason: "similarity below merge threshold",
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
