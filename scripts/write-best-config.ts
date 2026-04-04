import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { RetrievalWeights } from "../lib/config/memoryRules";
import {
  findBestRetrievalConfig,
  type TuneResult,
} from "./tune-retrieval";

export type BestConfigDocument = {
  name: string;
  threshold: number;
  weights: RetrievalWeights;
  score: number;
  updatedAt: string;
};

export const DEFAULT_BEST_CONFIG_PATH = path.join(
  process.cwd(),
  "data",
  "eval",
  "best-config.json",
);

export async function writeBestConfig(options?: {
  filePath?: string;
  now?: () => Date;
  selectBest?: () => Promise<TuneResult>;
}): Promise<BestConfigDocument> {
  const selectBest =
    options?.selectBest ??
    (async () => {
      const result = await findBestRetrievalConfig({
        logRuns: true,
        printTop: true,
      });
      return result.best;
    });

  const best = await selectBest();
  if (best.error) {
    throw new Error(`best config is invalid: ${best.error}`);
  }

  const now = options?.now ?? (() => new Date());
  const output: BestConfigDocument = {
    name: best.config.name,
    threshold: best.config.threshold,
    weights: best.config.weights,
    score: Number(best.score.toFixed(2)),
    updatedAt: now().toISOString(),
  };

  const outputPath = options?.filePath ?? DEFAULT_BEST_CONFIG_PATH;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  return output;
}

export async function main(): Promise<void> {
  const output = await writeBestConfig();
  console.log(`Wrote best retrieval config to ${DEFAULT_BEST_CONFIG_PATH}`);
  console.log(JSON.stringify(output, null, 2));
}

const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (entryFilePath === currentFilePath) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
