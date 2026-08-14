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
] as const;

export type EpochInputModality = (typeof EPOCH_INPUT_MODALITIES)[number];
export type EpochInputTrust = "user_asserted" | "observed" | "external" | "derived";

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
  contentSha256: string;
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
  if (explicit && (EPOCH_INPUT_MODALITIES as readonly string[]).includes(explicit)) return explicit as EpochInputModality;
  const contentType = string(input.contentType)?.toLowerCase() ?? "";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("word")) return "document";
  if (contentType.includes("csv") || contentType.includes("spreadsheet")) return "table";
  if (contentType.includes("json") || contentType.includes("yaml") || contentType.includes("xml")) return "structured";
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
  return {
    version: "epoch_input_envelope.v1",
    id: string(input.id) ?? `input_${randomUUID()}`,
    modality: detectModality(input),
    content,
    ...(string(input.contentType) ? { contentType: string(input.contentType)! } : {}),
    source,
    trust: normalizedTrust,
    capturedAt: new Date(capturedAt).toISOString(),
    metadata: record(input.metadata),
    contentSha256: hash(content),
  };
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
