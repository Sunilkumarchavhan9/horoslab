import { describe, expect, it } from "vitest";
import { inspectEpochMultimodalConnectors } from "../lib/epoch/multimodalConnectorReadiness";

describe("Epoch multimodal connector readiness", () => {
  it("does not claim unconfigured external connectors are live", () => {
    const report = inspectEpochMultimodalConnectors({});
    expect(report.unavailableCount).toBe(11);
    expect(report.connectors.every((item) => item.status === "UNAVAILABLE")).toBe(true);
  });

  it("recognizes configured local and cloud connector boundaries", () => {
    const report = inspectEpochMultimodalConnectors({
      EPOCH_PDF_PARSER: "pypdf",
      EPOCH_PARQUET_PARSER: "pyarrow",
      DATABASE_URL: "postgresql://localhost/epoch",
      GITHUB_TOKEN: "configured-but-not-emitted",
      KUBECONFIG: "C:\\kubeconfig",
      AWS_REGION: "ap-south-1",
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
    });
    expect(report.connectors.find((item) => item.kind === "pdf")?.mode).toBe("local");
    expect(report.connectors.find((item) => item.kind === "github")?.status).toBe("READY");
    expect(report.connectors.find((item) => item.kind === "telemetry")?.status).toBe("READY");
  });
});
