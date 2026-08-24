import { describe, expect, it } from "vitest";
import { buildCanonicalTelemetryObservation, buildRuntimeCapability, CANONICAL_ADAPTERS } from "../lib/epoch/canonical";

const base = { workspaceId: "ws-1", correlationId: "corr-1", traceId: "trace-1", now: new Date("2026-08-17T00:00:00.000Z") };

describe("Epoch canonical provider adapters", () => {
  it("publishes the required adapter boundary", () => {
    expect(CANONICAL_ADAPTERS.map((adapter) => adapter.id)).toEqual(expect.arrayContaining(["huggingface", "vllm", "sglang", "kubernetes", "opentelemetry", "object-storage", "cloud", "gpu"]));
  });
  it("maps telemetry into measured canonical observation with integrity", () => {
    const result = buildCanonicalTelemetryObservation({ ...base, missionId: "mission-1", environmentId: "env-1", source: "otel-test", contentType: "text/prometheus", content: "http_requests_total{service=\"api\"} 4" });
    expect(result.observation.provenance.classification).toBe("MEASURED");
    expect(result.observation.provenance.integritySha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("maps runtime probes into capabilities", () => {
    const capability = buildRuntimeCapability({ ...base, provider: "vllm", status: "available", inputTypes: ["text"], outputTypes: ["text"], probe: { reachable: true } });
    expect(capability.name).toBe("vllm.runtime"); expect(capability.provenance.sourceType).toBe("runtime-probe");
  });
});
