import { describe, expect, it } from "vitest";
import { compileEpochMissionSpecification, evaluateEpochConstraints } from "../lib/epoch/outcomeCompiler";

describe("Epoch mission specification compiler", () => {
  it("compiles explicit and acceptance-criteria constraints without inventing unknown values", () => {
    const specification = compileEpochMissionSpecification({
      model: { source: "huggingface", repositoryId: "Qwen/Qwen3-8B", revision: "main", commitSha: "abc123", metadata: { license: "apache-2.0", gated: false } },
      outcome: { objective: "reduce inference cost" },
      constraints: { metrics: [{ metric: "quality", operator: ">=", target: 97, unit: "%" }] },
      baseline: { quality: 100, p95Ms: 420 },
      workload: { requestsPerSecond: 20, concurrency: 8 },
      acceptanceCriteria: ["p99 <= 300ms", "No production downtime"],
    }, new Date("2026-01-01T00:00:00.000Z"));

    expect(specification.readiness).toBe("ready");
    expect(specification.constraints.hard).toHaveLength(2);
    expect(specification.constraints.hard[0]).toMatchObject({ metric: "quality", target: 97, unit: "%" });
    expect(specification.constraints.unresolved).toEqual(["No production downtime"]);
    expect(specification.model).toMatchObject({ repositoryId: "Qwen/Qwen3-8B", revision: "main" });
    expect(specification.model.inspection?.governance.eligible).toBe(true);
  });

  it("evaluates measurable constraints and fails missing measurements", () => {
    const specification = compileEpochMissionSpecification({
      baseline: { quality: 100 },
      workload: { requestsPerSecond: 1 },
      constraints: { metrics: [{ metric: "p99", operator: "<=", target: 300, unit: "ms" }] },
    });
    const result = evaluateEpochConstraints(specification.constraints.hard, { p99: 301 });
    expect(result[0]).toMatchObject({ actual: 301, passed: false });
    expect(evaluateEpochConstraints(specification.constraints.hard, {})[0]).toMatchObject({ actual: null, passed: false });
  });
});
