import "dotenv/config";
import { MEMORY_RULES, type RetrievalWeights } from "../lib/config/memoryRules";
import { getRetrievalWeights, setRetrievalWeights} from "../lib/config/retrievalWeights";
import { runAllCases } from "./eval/harness";

type TuneConfig = {
  threshold: number;
  weights: RetrievalWeights;
  name: string;
};

type TuneResult = {
  config: TuneConfig;
  passed: number;
  total: number;
  score: number;
  error?: string;
};

const THRESHOLDS = [0.6, 0.65, 0.7];

const WEIGHT_SETS: Array<{ name: string; weights: RetrievalWeights }> = [
  {
    name: "default",
    weights: { semantic: 0.4, typeRelevance: 0.25, importance: 0.2, recency: 0.15 },
  },
  {
    name: "type-heavy",
    weights: { semantic: 0.32, typeRelevance: 0.33, importance: 0.2, recency: 0.15 },
  },
  {
    name: "semantic-heavy",
    weights: { semantic: 0.5, typeRelevance: 0.2, importance: 0.18, recency: 0.12 },
  },
  {
    name: "importance-heavy",
    weights: { semantic: 0.34, typeRelevance: 0.22, importance: 0.3, recency: 0.14 },
  },
];

function validateThreshold(value: number): string | null {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return "threshold must be between 0 and 1";
  }
  return null;
}

function validateWeights(weights: RetrievalWeights): string | null {
  const entries: Array<[keyof RetrievalWeights, number]> = [
    ["semantic", weights.semantic],
    ["typeRelevance", weights.typeRelevance],
    ["importance", weights.importance],
    ["recency", weights.recency],
  ];

  for (const [key, value] of entries) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      return `${key} must be between 0 and 1`;
    }
  }

  const sum =
    weights.semantic +
    weights.typeRelevance +
    weights.importance +
    weights.recency;

  if (Math.abs(sum - 1) > 1e-6) {
    return `weights must sum to 1 (got ${sum.toFixed(6)})`;
  }

  return null;
}

function buildConfigs(): TuneConfig[] {
  const configs: TuneConfig[] = [];

  for (const threshold of THRESHOLDS) {
    for (const item of WEIGHT_SETS) {
      configs.push({
        name: `${item.name}@${threshold}`,
        threshold,
        weights: item.weights,
      });
    }
  }

  return configs;
}

async function runConfig(config: TuneConfig): Promise<TuneResult> {
  const thresholdError = validateThreshold(config.threshold);
  if (thresholdError) {
    return { config, passed: 0, total: 0, score: 0, error: thresholdError };
  }

  const weightsError = validateWeights(config.weights);
  if (weightsError) {
    return { config, passed: 0, total: 0, score: 0, error: weightsError };
  }

  const originalThreshold = MEMORY_RULES.scoring.acceptThreshold;
  const originalWeights = getRetrievalWeights();

  try {
    MEMORY_RULES.scoring.acceptThreshold = config.threshold;

    const setResult = setRetrievalWeights(config.weights);
    if (!setResult.ok) {
      return { config, passed: 0, total: 0, score: 0, error: setResult.error };
    }

    const summary = await runAllCases({ printEach: false });
    return {
      config,
      passed: summary.passed,
      total: summary.total,
      score: summary.score,
    };
  } finally {
    MEMORY_RULES.scoring.acceptThreshold = originalThreshold;
    const restore = setRetrievalWeights(originalWeights);
    if (!restore.ok) {
      throw new Error(`failed to restore retrieval weights: ${restore.error}`);
    }
  }
}

async function main(): Promise<void> {
  const configs = buildConfigs();
  const results: TuneResult[] = [];

  for (const config of configs) {
    const result = await runConfig(config);
    results.push(result);

    if (result.error) {
      console.log(
        `[SKIP] ${config.name} -> ${result.error}`,
      );
      continue;
    }

    console.log(
      `[RUN] ${config.name} -> ${result.passed}/${result.total} (${result.score.toFixed(1)}%)`,
    );
  }

  const valid = results.filter((r) => !r.error);
  if (valid.length === 0) {
    throw new Error("no valid tuning configs were executed");
  }

  valid.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.passed !== a.passed) return b.passed - a.passed;
    return a.config.name.localeCompare(b.config.name);
  });

  console.log("\nTop 5 configs:");
  for (const item of valid.slice(0, 5)) {
    console.log(
      `- ${item.config.name} -> ${item.passed}/${item.total} (${item.score.toFixed(1)}%)`,
    );
  }

  const best = valid[0];
  console.log("\nBest config by score:");
  console.log(JSON.stringify(best, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
