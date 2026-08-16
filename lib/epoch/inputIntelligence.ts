import { createHash, randomUUID } from "node:crypto";

export const EPOCH_INPUT_MODALITIES = [
  "text",
  "audio",
  "image",
  "video",
  "document",
  "table",
  "structured",
  "telemetry",
  "code",
  "api",
  "database",
  "billing",
  "event",
  "sensor",
  "model",
  "artifact",
  "repository",
  "cloud_state",
  "kubernetes_state",
  "observability",
  "business_system",
] as const;

export type EpochInputModality = (typeof EPOCH_INPUT_MODALITIES)[number];
export type EpochInputTrust = "user_asserted" | "observed" | "external" | "derived";
export type EpochInputClassification = "OBSERVED" | "MEASURED" | "USER_ASSERTED" | "EXTERNAL" | "INFERRED" | "SIMULATED" | "PREDICTED" | "UNKNOWN" | "STALE" | "CONTRADICTED" | "VERIFIED";

export type EpochInputEnvelope = {
  version: "epoch_input_envelope.v1";
  id: string;
  modality: EpochInputModality;
  content: unknown;
  contentType?: string;
  source: string;
  trust: EpochInputTrust;
  capturedAt: string;
  metadata: Record<string, unknown>;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  classification: EpochInputClassification;
  validFrom: string;
  validUntil?: string;
  ingestionVersion: string;
  contentSha256: string;
  integritySha256: string;
};

export type EpochIntent = {
  version: "epoch_intent.v1";
  action: "discover" | "optimize" | "benchmark" | "evaluate" | "deploy" | "observe" | "build" | "unknown";
  objective: string | null;
  confidence: number;
  evidence: string[];
};

export type EpochOutcomeContract = {
  version: "epoch_outcome_contract.v1";
  objective: string;
  successCriteria: string[];
  constraints: Record<string, unknown>;
  baseline: Record<string, unknown>;
  workload: Record<string, unknown>;
  intent: EpochIntent;
  sourceInputIds: string[];
  contractSha256: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function detectModality(input: Record<string, unknown>): EpochInputModality {
  const explicit = string(input.modality);
  if (explicit) {
    if (!(EPOCH_INPUT_MODALITIES as readonly string[]).includes(explicit)) throw new Error("epoch_input_invalid_modality");
    return explicit as EpochInputModality;
  }
  const contentType = string(input.contentType)?.toLowerCase() ?? "";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("word")) return "document";
  if (contentType.includes("csv") || contentType.includes("spreadsheet")) return "table";
  if (contentType.includes("json") || contentType.includes("yaml") || contentType.includes("xml")) return "structured";
  if (contentType.includes("parquet")) return "table";
  if (contentType.includes("javascript") || contentType.includes("typescript") || contentType.includes("python") || contentType.includes("code")) return "code";
  if (input.source === "github" || input.source === "gitlab" || input.source === "repository") return "repository";
  if (input.source === "aws" || input.source === "gcp" || input.source === "azure" || input.source === "cloud") return "cloud_state";
  if (input.source === "kubernetes" || input.source === "k8s") return "kubernetes_state";
  if (input.source === "billing" || input.source === "cloud-billing") return "billing";
  if (input.source === "otel" || input.source === "prometheus" || input.source === "observability") return "observability";
  if (input.source === "api" || input.source === "webhook") return "api";
  if (input.source === "database" || input.source === "postgres" || input.source === "mysql") return "database";
  if (input.source === "event" || input.source === "event-bus") return "event";
  if (input.source === "sensor") return "sensor";
  if (input.source === "model-registry") return "model";
  if (input.source === "artifact-store") return "artifact";
  if (input.source === "business-system") return "business_system";
  if (record(input.content).metrics || record(input.content).timestamp || input.source === "telemetry") return "telemetry";
  if (Array.isArray(input.content) && input.content.every((item) => record(item).id || record(item).value)) return "table";
  return "text";
}

export function normalizeEpochInputEnvelope(input: Record<string, unknown>, now = new Date()): EpochInputEnvelope {
  const content = input.content ?? input.payload ?? input.text ?? input.data ?? null;
  const source = string(input.source) ?? "user";
  const trust = string(input.trust);
  const normalizedTrust: EpochInputTrust = trust === "observed" || trust === "external" || trust === "derived" ? trust : "user_asserted";
  const capturedAt = string(input.capturedAt) ?? now.toISOString();
  if (Number.isNaN(Date.parse(capturedAt))) throw new Error("epoch_input_invalid_captured_at");
  const validFrom = string(input.validFrom) ?? capturedAt;
  const validUntil = string(input.validUntil);
  if (Number.isNaN(Date.parse(validFrom)) || (validUntil && Number.isNaN(Date.parse(validUntil)))) throw new Error("epoch_input_invalid_validity_window");
  if (validUntil && Date.parse(validUntil) < Date.parse(validFrom)) throw new Error("epoch_input_invalid_validity_window");
  const classification = string(input.classification);
  const allowedClassifications = ["OBSERVED", "MEASURED", "USER_ASSERTED", "EXTERNAL", "INFERRED", "SIMULATED", "PREDICTED", "UNKNOWN", "STALE", "CONTRADICTED", "VERIFIED"] as const;
  const normalizedClassification: EpochInputClassification = classification && (allowedClassifications as readonly string[]).includes(classification) ? classification as EpochInputClassification : normalizedTrust === "observed" ? "OBSERVED" : normalizedTrust === "external" ? "EXTERNAL" : normalizedTrust === "derived" ? "INFERRED" : "USER_ASSERTED";
  const envelope = {
    version: "epoch_input_envelope.v1" as const,
    id: string(input.id) ?? `input_${randomUUID()}`,
    modality: detectModality(input),
    content,
    ...(string(input.contentType) ? { contentType: string(input.contentType)! } : {}),
    source,
    trust: normalizedTrust,
    capturedAt: new Date(capturedAt).toISOString(),
    metadata: record(input.metadata),
    sensitivity: (string(input.sensitivity) === "public" || string(input.sensitivity) === "confidential" || string(input.sensitivity) === "restricted" ? string(input.sensitivity) : "internal") as EpochInputEnvelope["sensitivity"],
    classification: normalizedClassification,
    validFrom: new Date(validFrom).toISOString(),
    ...(validUntil ? { validUntil: new Date(validUntil).toISOString() } : {}),
    ingestionVersion: string(input.ingestionVersion) ?? "epoch_input_ingestion.v1",
    contentSha256: hash(content),
  };
  return { ...envelope, integritySha256: hash(envelope) };
}

export function validateEpochInputEnvelope(envelope: EpochInputEnvelope): { valid: true } | { valid: false; reasons: string[] } {
  const reasons: string[] = [];
  if (!envelope.id || !envelope.source) reasons.push("identity_missing");
  if (!(EPOCH_INPUT_MODALITIES as readonly string[]).includes(envelope.modality)) reasons.push("unsupported_modality");
  if (!/^[a-f0-9]{64}$/.test(envelope.contentSha256) || !/^[a-f0-9]{64}$/.test(envelope.integritySha256)) reasons.push("integrity_missing");
  if (envelope.validUntil && Date.parse(envelope.validUntil) < Date.parse(envelope.validFrom)) reasons.push("invalid_validity_window");
  return reasons.length ? { valid: false, reasons } : { valid: true };
}

const ACTIONS: Array<{ action: EpochIntent["action"]; terms: string[] }> = [
  { action: "deploy", terms: ["deploy", "release", "production", "rollout"] },
  { action: "benchmark", terms: ["benchmark", "measure", "throughput", "latency"] },
  { action: "optimize", terms: ["optimize", "optimise", "cheapest", "faster", "reduce cost"] },
  { action: "evaluate", terms: ["evaluate", "quality", "compare", "score"] },
  { action: "observe", terms: ["observe", "monitor", "telemetry", "drift"] },
  { action: "discover", terms: ["discover", "find", "search", "unknown"] },
  { action: "build", terms: ["build", "create", "implement", "generate"] },
];

export function extractEpochIntent(envelope: EpochInputEnvelope): EpochIntent {
  const content = typeof envelope.content === "string" ? envelope.content : JSON.stringify(envelope.content ?? {});
  const text = content.toLowerCase();
  const matched = ACTIONS.find((candidate) => candidate.terms.some((term) => text.includes(term)));
  const objective = typeof envelope.content === "string"
    ? envelope.content.trim().slice(0, 4000) || null
    : string(record(envelope.content).objective) ?? string(record(envelope.content).goal) ?? null;
  return {
    version: "epoch_intent.v1",
    action: matched?.action ?? "unknown",
    objective,
    confidence: matched ? Math.min(0.95, 0.55 + (matched.terms.filter((term) => text.includes(term)).length * 0.1)) : 0.1,
    evidence: matched ? matched.terms.filter((term) => text.includes(term)).map((term) => `matched:${term}`) : ["no_known_action_signal"],
  };
}

export function compileEpochOutcomeContract(input: {
  inputs: EpochInputEnvelope[];
  objective?: string;
  successCriteria?: string[];
  constraints?: Record<string, unknown>;
  baseline?: Record<string, unknown>;
  workload?: Record<string, unknown>;
}): EpochOutcomeContract {
  const intents = input.inputs.map(extractEpochIntent);
  const primary = intents.find((item) => item.objective) ?? intents[0] ?? null;
  const objective = string(input.objective) ?? primary?.objective ?? "Undeclared customer outcome";
  const successCriteria = (input.successCriteria ?? []).filter((item) => item.trim()).map((item) => item.trim());
  const contract = {
    version: "epoch_outcome_contract.v1" as const,
    objective,
    successCriteria,
    constraints: record(input.constraints),
    baseline: record(input.baseline),
    workload: record(input.workload),
    intent: primary ?? { version: "epoch_intent.v1" as const, action: "unknown" as const, objective: null, confidence: 0, evidence: ["no_input"] },
    sourceInputIds: input.inputs.map((item) => item.id),
  };
  return { ...contract, contractSha256: hash(contract) };
}
