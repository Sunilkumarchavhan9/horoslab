import { describe, expect, it } from "vitest";
import { compileEpochOutcomeContract, extractEpochIntent, normalizeEpochInputEnvelope, validateEpochInputEnvelope } from "../lib/epoch/inputIntelligence";
import { ingestEpochInput, validateEpochIntent } from "../lib/epoch/inputIngestion";

describe("Epoch input intelligence", () => {
  it("normalizes multimodal input with deterministic trust and content provenance", () => {
    const envelope = normalizeEpochInputEnvelope({ contentType: "image/png", content: { uri: "s3://example/image.png" }, source: "customer-upload" });
    expect(envelope.modality).toBe("image");
    expect(envelope.trust).toBe("user_asserted");
    expect(envelope.contentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(validateEpochInputEnvelope(envelope)).toEqual({ valid: true });
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

  it("preserves the original payload identity for durable mission storage", () => {
    const original = { objective: "reduce cost", sourceSystem: "billing", values: [3, 2, 1] };
    const first = normalizeEpochInputEnvelope({ modality: "structured", content: original, source: "billing-export", trust: "external" });
    const second = normalizeEpochInputEnvelope({ modality: "structured", content: original, source: "billing-export", trust: "external" });
    expect(first.content).toEqual(original);
    expect(first.contentSha256).toBe(second.contentSha256);
    expect(first.trust).toBe("external");
  });

  it("supports infrastructure and business-system modalities with validity and classification", () => {
    const envelope = normalizeEpochInputEnvelope({ source: "kubernetes", content: { cluster: "local" }, classification: "MEASURED", validUntil: "2026-09-01T00:00:00.000Z" });
    expect(envelope.modality).toBe("kubernetes_state");
    expect(envelope.classification).toBe("MEASURED");
    expect(envelope.sensitivity).toBe("internal");
    expect(envelope.integritySha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects an invalid modality and reversed validity window", () => {
    expect(() => normalizeEpochInputEnvelope({ modality: "not-a-modality", content: "x" })).toThrow("epoch_input_invalid_modality");
    expect(() => normalizeEpochInputEnvelope({ modality: "text", content: "x", validFrom: "2026-09-02", validUntil: "2026-09-01" })).toThrow("epoch_input_invalid_validity_window");
  });

  it("parses JSON and CSV locally while preserving deterministic content identity", () => {
    const structured = normalizeEpochInputEnvelope({ modality: "structured", content: '{"objective":"reduce cost"}' });
    const table = normalizeEpochInputEnvelope({ modality: "table", content: "name,cost\napi,10" });
    expect(ingestEpochInput(structured)).toMatchObject({ status: "parsed", parser: "json", normalizedContent: { objective: "reduce cost" } });
    expect(ingestEpochInput(table)).toMatchObject({ status: "parsed", parser: "csv-rfc4180", normalizedContent: [{ name: "api", cost: "10" }] });
  });

  it("handles quoted CSV fields and does not fake Parquet execution", () => {
    const table = normalizeEpochInputEnvelope({ modality: "table", content: 'name,notes\napi,"p99, high"' });
    expect(ingestEpochInput(table)).toMatchObject({ parser: "csv-rfc4180", normalizedContent: [{ name: "api", notes: "p99, high" }] });
    const parquet = normalizeEpochInputEnvelope({ contentType: "application/vnd.apache.parquet", content: { uri: "s3://epoch/data.parquet" } });
    expect(ingestEpochInput(parquet)).toMatchObject({ status: "accepted_for_external_processing", parser: "parquet-external-boundary" });
  });

  it("does not fake media extraction or connector access", () => {
    const audio = normalizeEpochInputEnvelope({ modality: "audio", content: { uri: "file://incident.wav" } });
    const cloud = normalizeEpochInputEnvelope({ modality: "cloud_state", content: { resourceId: "i-123" }, source: "aws" });
    expect(ingestEpochInput(audio).status).toBe("accepted_for_external_processing");
    expect(ingestEpochInput(audio).reasons[0]).toContain("external_runtime");
    expect(ingestEpochInput(cloud).status).toBe("accepted_for_external_processing");
  });

  it("validates intent confidence and required objectives", () => {
    const envelope = normalizeEpochInputEnvelope({ content: "" });
    const intent = extractEpochIntent(envelope);
    expect(validateEpochIntent(intent, envelope)).toMatchObject({ valid: false });
  });
});
