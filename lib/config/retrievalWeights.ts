import { MEMORY_RULES, type RetrievalWeights } from "./memoryRules";

const DEFAULT_RETRIEVAL_WEIGHTS: RetrievalWeights = {
  ...MEMORY_RULES.retrieval.weights,
};

let runtimeRetrievalWeights: RetrievalWeights = {
  ...DEFAULT_RETRIEVAL_WEIGHTS,
};

function isValidWeight(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function getDefaultRetrievalWeights(): RetrievalWeights {
  return { ...DEFAULT_RETRIEVAL_WEIGHTS };
}

export function getRetrievalWeights(): RetrievalWeights {
  return { ...runtimeRetrievalWeights };
}

export function setRetrievalWeights(
  next: RetrievalWeights,
):
  | { ok: true; weights: RetrievalWeights }
  | { ok: false; error: string } {
  const keys: Array<keyof RetrievalWeights> = [
    "semantic",
    "typeRelevance",
    "importance",
    "recency",
  ];

  for (const key of keys) {
    if (!isValidWeight(next[key])) {
      return { ok: false, error: `${key} must be between 0 and 1` };
    }
  }

  const sum =
    next.semantic + next.typeRelevance + next.importance + next.recency;
  if (sum <= 0) {
    return { ok: false, error: "weights sum must be greater than 0" };
  }

  runtimeRetrievalWeights = { ...next };
  return { ok: true, weights: getRetrievalWeights() };
}

export function resetRetrievalWeights(): void {
  runtimeRetrievalWeights = { ...DEFAULT_RETRIEVAL_WEIGHTS };
}
