import { createHash } from "node:crypto";

export type EpochConnectorKind = "speech" | "image" | "video" | "pdf" | "parquet" | "database" | "github" | "kubernetes" | "aws" | "billing" | "telemetry";
export type EpochConnectorStatus = "READY" | "LOCAL_ONLY" | "UNAVAILABLE";

export type EpochConnectorReadiness = {
  version: "epoch_connector_readiness.v1";
  checkedAt: string;
  connectors: Array<{ kind: EpochConnectorKind; status: EpochConnectorStatus; mode: "local" | "endpoint" | "sdk" | "missing"; configured: boolean; reasons: string[] }>;
  readyCount: number;
  unavailableCount: number;
  evidenceSha256: string;
};

const CONNECTORS: EpochConnectorKind[] = ["speech", "image", "video", "pdf", "parquet", "database", "github", "kubernetes", "aws", "billing", "telemetry"];

function configured(env: NodeJS.ProcessEnv, ...names: string[]): boolean {
  return names.some((name) => typeof env[name] === "string" && env[name]!.trim().length > 0);
}

function endpoint(env: NodeJS.ProcessEnv, kind: EpochConnectorKind): string | undefined {
  const value = env[`EPOCH_CONNECTOR_${kind.toUpperCase()}_ENDPOINT`];
  return value?.trim() || undefined;
}

function assess(kind: EpochConnectorKind, env: NodeJS.ProcessEnv): EpochConnectorReadiness["connectors"][number] {
  const url = endpoint(env, kind);
  if (url) return { kind, status: "READY", mode: "endpoint", configured: true, reasons: [] };
  if (kind === "pdf" && configured(env, "EPOCH_PDF_PARSER", "EPOCH_DOCUMENT_PARSER")) return { kind, status: "READY", mode: "local", configured: true, reasons: [] };
  if (kind === "parquet" && configured(env, "EPOCH_PARQUET_PARSER")) return { kind, status: "READY", mode: "local", configured: true, reasons: [] };
  if (kind === "database" && configured(env, "DATABASE_URL", "EPOCH_DATABASE_URL")) return { kind, status: "READY", mode: "sdk", configured: true, reasons: [] };
  if (kind === "github" && configured(env, "GITHUB_TOKEN", "GH_TOKEN", "EPOCH_GITHUB_TOKEN")) return { kind, status: "READY", mode: "sdk", configured: true, reasons: [] };
  if (kind === "kubernetes" && configured(env, "KUBECONFIG", "EPOCH_KUBERNETES_API")) return { kind, status: "READY", mode: "sdk", configured: true, reasons: [] };
  if (kind === "aws" && configured(env, "AWS_REGION", "AWS_DEFAULT_REGION")) return { kind, status: "READY", mode: "sdk", configured: true, reasons: [] };
  if (kind === "billing" && configured(env, "AWS_REGION", "AWS_DEFAULT_REGION", "EPOCH_BILLING_ENDPOINT")) return { kind, status: "READY", mode: "sdk", configured: true, reasons: [] };
  if (kind === "telemetry" && configured(env, "OTEL_EXPORTER_OTLP_ENDPOINT", "PROMETHEUS_PUSHGATEWAY_URL", "EPOCH_TELEMETRY_ENDPOINT")) return { kind, status: "READY", mode: "endpoint", configured: true, reasons: [] };
  return { kind, status: "UNAVAILABLE", mode: "missing", configured: false, reasons: [`${kind}_connector_not_configured`] };
}

export function inspectEpochMultimodalConnectors(env: NodeJS.ProcessEnv = process.env): EpochConnectorReadiness {
  const checkedAt = new Date().toISOString();
  const connectors = CONNECTORS.map((kind) => assess(kind, env));
  const summary = { version: "epoch_connector_readiness.v1" as const, checkedAt, connectors, readyCount: connectors.filter((item) => item.status === "READY").length, unavailableCount: connectors.filter((item) => item.status === "UNAVAILABLE").length };
  return { ...summary, evidenceSha256: createHash("sha256").update(JSON.stringify(summary)).digest("hex") };
}
