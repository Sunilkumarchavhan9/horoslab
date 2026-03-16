import type { Memory } from "./types";

export interface EvolveResult {
  shouldEvolve: boolean;
  reason: string;
  evolvedMemory?: Memory;
}

const STRONGER_SIGNAL_REGEX =
  /\b(built|trained|solved|shipped|implemented|completed|deployed)\b/i;

function normalize(text: string): string {
  // TODO:
  // lowercase, remove extra spaces
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasStrongerSignal(text: string): boolean {
  // TODO:
  // return regex test on normalized text
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

  const strongerByImportance =
    incoming.importanceScore > existing.importanceScore;

  const strongerByConfidence =
    incoming.confidence > existing.confidence;

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
  };
}
