import { describe, expect, it } from "vitest";
import { compileEpochOutcomeContract, extractEpochIntent, normalizeEpochInputEnvelope } from "../lib/epoch/inputIntelligence";

describe("Epoch input intelligence", () => {
  it("normalizes multimodal input with deterministic trust and content provenance", () => {
    const envelope = normalizeEpochInputEnvelope({ contentType: "image/png", content: { uri: "s3://example/image.png" }, source: "customer-upload" });
    expect(envelope.modality).toBe("image");
    expect(envelope.trust).toBe("user_asserted");
    expect(envelope.contentSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("extracts a bounded intent without inventing certainty", () => {
    const envelope = normalizeEpochInputEnvelope({ content: "Benchmark this model for lower latency and cost" });
    const intent = extractEpochIntent(envelope);
    expect(intent.action).toBe("benchmark");
    expect(intent.confidence).toBeGreaterThan(0.5);
    expect(intent.evidence).toContain("matched:benchmark");
  });

  it("compiles a hashable outcome contract from normalized inputs", () => {
    const input = normalizeEpochInputEnvelope({ content: { goal: "deploy a reliable API" }, modality: "structured" });
    const contract = compileEpochOutcomeContract({ inputs: [input], successCriteria: ["p99_ms <= 500"], baseline: { p99_ms: 900 } });
    expect(contract.objective).toBe("deploy a reliable API");
    expect(contract.sourceInputIds).toEqual([input.id]);
    expect(contract.contractSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
