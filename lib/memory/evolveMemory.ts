import type { Memory } from "./types";
import { MEMORY_RULES } from "../config/memoryRules";

export interface EvolveResult {
  shouldEvolve: boolean;
  reason: string;
  evolvedMemory?: Memory;
  baseMemory?: Memory;
}

const STRONGER_SIGNAL_REGEX =
  /\b(built|trained|solved|shipped|implemented|completed|deployed)\b/i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .replace(/[^\w\s]/g, " ")
      .split(" ")
     .map((token) => {
        const normalizedToken = token.trim();
        if (normalizedToken.length > 4 && normalizedToken.endsWith("s")) {
          return normalizedToken.slice(0, -1);
        }
        return normalizedToken;
      })

      .filter(Boolean),
  );
}

function shareStrongKeyword(a: string, b: string): boolean {
  const STOP_WORDS = new Set([
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

  const aTokens = [...tokenize(a)].filter((token) => !STOP_WORDS.has(token));
  const bTokens = [...tokenize(b)].filter((token) => !STOP_WORDS.has(token));

  return aTokens.some((token) => bTokens.includes(token));
}

function hasStrongerSignal(text: string): boolean {
  return STRONGER_SIGNAL_REGEX.test(normalize(text));
}

function chooseEvolvedText(existingText: string, incomingText: string): string {
  const existing = normalize(existingText);
  const incoming = normalize(incomingText);

  if (hasStrongerSignal(incomingText) && !hasStrongerSignal(existingText)) {
    return incomingText;
  }

  if (incoming.length > existing.length) {
    return incomingText;
  }

  return existingText;
}


export function evolveMemory(existing: Memory, incoming: Memory): EvolveResult {
  if (existing.userId !== incoming.userId) {
    return {
      shouldEvolve: false,
      reason: "different users",
    };
  }

  if (existing.type !== incoming.type) {
    return {
      shouldEvolve: false,
      reason: "different memory types",
    };
  }

  const strongKeywordOverlap = shareStrongKeyword(
    existing.content,
    incoming.content,
  );

  if (!strongKeywordOverlap) {
    return {
      shouldEvolve: false,
      reason: "no strong keyword overlap",
    };
  }

  const strongerByImportance =
    incoming.importanceScore - existing.importanceScore >=
    MEMORY_RULES.evolve.minImportanceDelta;

  const strongerByConfidence =
    incoming.confidence - existing.confidence >=
    MEMORY_RULES.evolve.minConfidenceDelta;

  const strongerBySignal =
    hasStrongerSignal(incoming.content) && !hasStrongerSignal(existing.content);

  const strongerBySpecificity =
    normalize(incoming.content).length > normalize(existing.content).length;

  const shouldEvolve =
    strongerByImportance ||
    strongerByConfidence ||
    strongerBySignal ||
    strongerBySpecificity;

  if (!shouldEvolve) {
    return {
      shouldEvolve: false,
      reason: "incoming memory is not stronger",
    };
  }

  const evolvedMemory: Memory = {
    ...existing,
    content: chooseEvolvedText(existing.content, incoming.content),
    summary: chooseEvolvedText(existing.summary, incoming.summary),
    importanceScore: Math.max(existing.importanceScore, incoming.importanceScore),
    confidence: Math.max(existing.confidence, incoming.confidence),
    evidenceCount: existing.evidenceCount + incoming.evidenceCount,
    updatedAt: new Date().toISOString(),
    status: "active",
  };

  return {
    shouldEvolve: true,
    reason: "incoming memory contains stronger evidence",
    evolvedMemory,
    baseMemory: existing,
  };
}
