import { describe, expect, it } from "vitest";
import { ingestEpochObservability } from "../lib/epoch/observabilityIngestion";

describe("Epoch observability ingestion", () => {
  it("normalizes Prometheus exposition samples", () => {
    const result = ingestEpochObservability({ source: "prometheus", contentType: "text/plain", content: '# HELP queue_depth Queue\nqueue_depth{worker="w1"} 3\n' });
    expect(result.status).toBe("OBSERVED");
    expect(result.samples[0]).toMatchObject({ name: "queue_depth", value: 3, labels: { worker: "w1" }, source: "prometheus" });
  });

  it("normalizes OTLP gauge data points", () => {
    const result = ingestEpochObservability({ source: "otel", contentType: "application/json", content: { resourceMetrics: [{ scopeMetrics: [{ metrics: [{ name: "gpu_utilization", gauge: { dataPoints: [{ asDouble: 0.72, attributes: [{ key: "gpu", value: { stringValue: "0" } }] }] } }] }] }] } });
    expect(result.status).toBe("OBSERVED");
    expect(result.samples[0]).toMatchObject({ name: "gpu_utilization", value: 0.72, labels: { gpu: "0" }, source: "otlp" });
  });
});
