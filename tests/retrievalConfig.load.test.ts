import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import path from "path";
import os from "os";
import { MEMORY_RULES } from "../lib/config/memoryRules";
import {
  getRetrievalWeights,
  setRetrievalWeights,
} from "../lib/config/retrievalWeights";
import { loadBestRetrievalConfig } from "../lib/config/loadBestRetrievalConfig";

describe("loadBestRetrievalConfig", () => {
  const originalThreshold = MEMORY_RULES.scoring.acceptThreshold;
  const originalWeights = getRetrievalWeights();
  const tempDirs: string[] = [];

  afterEach(() => {
    MEMORY_RULES.scoring.acceptThreshold = originalThreshold;
    setRetrievalWeights(originalWeights);

    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function writeTempConfig(data: unknown): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), "memoryos-best-config-"));
    tempDirs.push(dir);
    const file = path.join(dir, "best-config.json");
    writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    return file;
  }

  it("applies valid config threshold and weights", () => {
    const file = writeTempConfig({
      name: "tuned@0.7",
      threshold: 0.7,
      weights: {
        semantic: 0.35,
        typeRelevance: 0.3,
        importance: 0.2,
        recency: 0.15,
      },
      score: 99.5,
      updatedAt: "2026-04-03T00:00:00.000Z",
    });

    const loaded = loadBestRetrievalConfig(file);

    expect(loaded.name).toBe("tuned@0.7");
    expect(MEMORY_RULES.scoring.acceptThreshold).toBe(0.7);
    expect(getRetrievalWeights()).toEqual({
      semantic: 0.35,
      typeRelevance: 0.3,
      importance: 0.2,
      recency: 0.15,
    });
  });

  it("throws when weight sum is invalid", () => {
    const file = writeTempConfig({
      name: "bad-weights",
      threshold: 0.65,
      weights: {
        semantic: 0.4,
        typeRelevance: 0.25,
        importance: 0.2,
        recency: 0.1,
      },
      score: 95,
      updatedAt: "2026-04-03T00:00:00.000Z",
    });

    expect(() => loadBestRetrievalConfig(file)).toThrow(
      /weights must sum to 1/i,
    );
  });

  it("throws when threshold is invalid", () => {
    const file = writeTempConfig({
      name: "bad-threshold",
      threshold: 1.2,
      weights: {
        semantic: 0.4,
        typeRelevance: 0.25,
        importance: 0.2,
        recency: 0.15,
      },
      score: 90,
      updatedAt: "2026-04-03T00:00:00.000Z",
    });

    expect(() => loadBestRetrievalConfig(file)).toThrow(
      /threshold must be between 0 and 1/i,
    );
  });
});
