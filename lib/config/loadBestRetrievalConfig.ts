import { existsSync, readFileSync } from "fs";
import path from "path";
import { MEMORY_RULES, type RetrievalWeights } from "./memoryRules";
import { setRetrievalWeights } from "./retrievalWeights";

export interface BestRetrievalConfig {
  name: string;
  threshold: number;
  weights: RetrievalWeights;
  score: number;
  updatedAt: string;
}

const DEFAULT_BEST_CONFIG_PATH = path.join(
  process.cwd(),
  "data",
  "eval",
  "best-config.json",
);

function asFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function parseWeights(input: unknown): RetrievalWeights {
  if (!input || typeof input !== "object") {
    throw new Error("weights must be an object");
  }

  const obj = input as Record<string, unknown>;
  const weights: RetrievalWeights = {
    semantic: asFiniteNumber(obj.semantic, "weights.semantic"),
    typeRelevance: asFiniteNumber(
      obj.typeRelevance,
      "weights.typeRelevance",
    ),
    importance: asFiniteNumber(obj.importance, "weights.importance"),
    recency: asFiniteNumber(obj.recency, "weights.recency"),
  };

  const values = Object.values(weights);
  if (values.some((value) => value < 0 || value > 1)) {
    throw new Error("weights values must be between 0 and 1");
  }

  const sum =
    weights.semantic +
    weights.typeRelevance +
    weights.importance +
    weights.recency;
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`weights must sum to 1 (got ${sum.toFixed(6)})`);
  }

  return weights;
}

function parseConfig(raw: unknown): BestRetrievalConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("best config must be an object");
  }

  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== "string" || obj.name.trim().length === 0) {
    throw new Error("name must be a non-empty string");
  }

  const threshold = asFiniteNumber(obj.threshold, "threshold");
  if (threshold < 0 || threshold > 1) {
    throw new Error("threshold must be between 0 and 1");
  }

  const score = asFiniteNumber(obj.score, "score");

  if (typeof obj.updatedAt !== "string" || obj.updatedAt.trim().length === 0) {
    throw new Error("updatedAt must be a non-empty string");
  }

  return {
    name: obj.name,
    threshold,
    weights: parseWeights(obj.weights),
    score,
    updatedAt: obj.updatedAt,
  };
}

export function loadBestRetrievalConfig(
  filePath = DEFAULT_BEST_CONFIG_PATH,
): BestRetrievalConfig {
  if (!existsSync(filePath)) {
    throw new Error(`best retrieval config not found at: ${filePath}`);
  }

  const raw = readFileSync(filePath, "utf8");
  const parsed = parseConfig(JSON.parse(raw));

  MEMORY_RULES.scoring.acceptThreshold = parsed.threshold;
  const setResult = setRetrievalWeights(parsed.weights);
  if (!setResult.ok) {
    throw new Error(`failed to set retrieval weights: ${setResult.error}`);
  }

  return parsed;
}

export { DEFAULT_BEST_CONFIG_PATH };
