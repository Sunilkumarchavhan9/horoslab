import { mkdtempSync, readFileSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { writeBestConfig } from "../scripts/write-best-config";
import type { TuneResult } from "../scripts/tune-retrieval";

describe("writeBestConfig script", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes best-config.json with valid shape", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "memoryos-best-config-"));
    tempDirs.push(dir);
    const outputPath = path.join(dir, "best-config.json");

    const fakeBest: TuneResult = {
      config: {
        name: "default@0.65",
        threshold: 0.65,
        weights: {
          semantic: 0.4,
          typeRelevance: 0.25,
          importance: 0.2,
          recency: 0.15,
        },
      },
      passed: 20,
      total: 20,
      score: 100,
    };

    const written = await writeBestConfig({
      filePath: outputPath,
      now: () => new Date("2026-04-04T00:00:00.000Z"),
      selectBest: async () => fakeBest,
    });

    const diskRaw = readFileSync(outputPath, "utf8");
    const disk = JSON.parse(diskRaw) as Record<string, unknown>;

    expect(written.name).toBe("default@0.65");
    expect(written.threshold).toBe(0.65);
    expect(written.weights).toEqual({
      semantic: 0.4,
      typeRelevance: 0.25,
      importance: 0.2,
      recency: 0.15,
    });
    expect(written.score).toBe(100);
    expect(written.updatedAt).toBe("2026-04-04T00:00:00.000Z");

    expect(disk.name).toBe("default@0.65");
    expect(disk.threshold).toBe(0.65);
    expect(disk.score).toBe(100);
    expect(disk.updatedAt).toBe("2026-04-04T00:00:00.000Z");
    expect(disk.weights).toEqual({
      semantic: 0.4,
      typeRelevance: 0.25,
      importance: 0.2,
      recency: 0.15,
    });
  });
});
