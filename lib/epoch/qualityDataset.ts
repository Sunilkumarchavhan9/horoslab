import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { EpochQualityCase } from "./evaluationEngine";

export type EpochQualityDatasetCase = EpochQualityCase & { prompt: string; tags: string[] };
export type EpochQualityDataset = { version: "epoch_quality_dataset.v1"; id: string; cases: EpochQualityDatasetCase[]; sha256: string; source: string };

export function validateEpochQualityDataset(raw: unknown): EpochQualityDatasetCase[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 500) throw new Error("quality dataset must contain 1-500 cases");
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`quality case ${index} is invalid`);
    const value = item as Record<string, unknown>;
    if (typeof value.id !== "string" || !value.id.trim() || typeof value.prompt !== "string" || !value.prompt.trim()) throw new Error(`quality case ${index} requires id and prompt`);
    if (value.expectedContains === undefined && value.expectedRegex === undefined && value.expectedJson === undefined) throw new Error(`quality case ${index} requires an evaluator expectation`);
    if (value.expectedRegex !== undefined && typeof value.expectedRegex !== "string") throw new Error(`quality case ${index} has invalid expectedRegex`);
    return { id: value.id, input: value.prompt, prompt: value.prompt, expectedContains: typeof value.expectedContains === "string" ? value.expectedContains : undefined, expectedRegex: typeof value.expectedRegex === "string" ? value.expectedRegex : undefined, expectedJson: value.expectedJson && typeof value.expectedJson === "object" && !Array.isArray(value.expectedJson) ? value.expectedJson as Record<string, unknown> : undefined, weight: typeof value.weight === "number" ? value.weight : 1, tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [] };
  });
}

export async function loadEpochQualityDataset(path = join(process.cwd(), "data", "eval", "epoch-quality-cases.json")): Promise<EpochQualityDataset> {
  const content = await readFile(path, "utf8");
  const cases = validateEpochQualityDataset(JSON.parse(content) as unknown);
  return { version: "epoch_quality_dataset.v1", id: "epoch-local-quality-v1", cases, sha256: createHash("sha256").update(content).digest("hex"), source: path };
}
