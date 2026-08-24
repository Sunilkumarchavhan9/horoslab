import { randomUUID } from "node:crypto";
import { compileEpochMissionSpecification } from "../outcomeCompiler";
import { normalizeEpochInputEnvelope, extractEpochIntent } from "../inputIntelligence";
import {
  EPOCH_CANONICAL_CONTRACT_VERSION,
  type Intent,
  type Mission,
  type OutcomeContract,
} from "./contracts";

export type ComposerRequest = {
  workspaceId: string;
  actorId: string;
  source?: string;
  input: string | Record<string, unknown>;
  modality?: "text" | "api" | "system";
  now?: Date;
};

export type DiscoveryRequirement = {
  key: string;
  reason: string;
  required: boolean;
  resolution: "discover" | "ask" | "benchmark" | "observe" | "block";
};

export type CompilationPlan = {
  intent: Intent;
  outcomeContract: OutcomeContract;
  mission: Mission;
  references: Intent["references"];
  discoveryRequirements: DiscoveryRequirement[];
  unresolved: string[];
};

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function asText(input: string | Record<string, unknown>): string {
  if (typeof input === "string") return input.trim();
  const objective = input.objective ?? input.goal ?? input.request;
  return typeof objective === "string" ? objective.trim() : JSON.stringify(input);
}

function references(text: string): Intent["references"] {
  const values: Intent["references"] = [];
  const seen = new Set<string>();
  for (const raw of text.match(/@[A-Za-z0-9_./:-]+/g) ?? []) {
    if (seen.has(raw)) continue;
    seen.add(raw);
    const value = raw.slice(1).toLowerCase();
    const type = value.includes("qwen") || value.includes("llama") || value.includes("model") ? "MODEL"
      : value.includes("vllm") || value.includes("sglang") || value.includes("dynamo") ? "RUNTIME"
        : value.includes("h100") || value.includes("a100") || value.includes("gpu") ? "HARDWARE"
          : value.includes("factory") || value.includes("robot") ? "ENVIRONMENT"
            : value.includes("sensor") || value.includes("video") || value.includes("camera") ? "OBSERVATION"
              : value.includes("workload") || value.includes("traffic") ? "WORKLOAD"
                : "ENTITY";
    values.push({ raw, type, confidence: 0.9 });
  }
  return values;
}

function metricConstraints(text: string): Array<{ metric: string; operator: "lt" | "lte" | "gte" | "gt" | "eq" | "decrease" | "increase" | "non_regression"; target?: number; unit?: string; hard: boolean }> {
  const result: Array<{ metric: string; operator: "lt" | "lte" | "gte" | "gt" | "eq" | "decrease" | "increase" | "non_regression"; target?: number; unit?: string; hard: boolean }> = [];
  const add = (metric: string, operator: "lt" | "lte" | "gte" | "gt" | "eq" | "decrease" | "increase" | "non_regression", target?: number, unit?: string) => result.push({ metric, operator, ...(target === undefined ? {} : { target }), ...(unit ? { unit } : {}), hard: true });
  const cost = text.match(/(?:reduce|decrease|lower)[^\n]{0,80}(?:cost|price|spend)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i) ?? text.match(/(?:cost|price|spend)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%[^\n]{0,20}(?:reduction|lower|cheaper)/i);
  if (cost) add("inference_cost", "decrease", Number(cost[1]), "%");
  const p99 = text.match(/p(?:95|99)[^\d]{0,20}(\d+(?:\.\d+)?)\s*ms/i);
  if (p99) add(text.toLowerCase().includes("p95") ? "p95_latency" : "p99_latency", "lte", Number(p99[1]), "ms");
  const quality = text.match(/quality[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i);
  if (quality) add("quality", "gte", Number(quality[1]), "%");
  if (/without[^\n]{0,50}(?:quality|latency|availability)[^\n]{0,50}(?:drop|increase|worse|reduction)/i.test(text)) {
    add("quality", "non_regression");
  }
  return result;
}

function title(text: string): string {
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

export function compileEpochComposerRequest(request: ComposerRequest): CompilationPlan {
  const now = request.now ?? new Date();
  const text = asText(request.input);
  if (!text) throw new Error("COMPOSER_INPUT_REQUIRED");
  const input = normalizeEpochInputEnvelope({
    content: text,
    source: request.source ?? "composer",
    modality: request.modality ?? "text",
    capturedAt: now.toISOString(),
  }, now);
  const extracted = extractEpochIntent(input);
  const refs = references(text);
  const constraints = metricConstraints(text);
  const specification = compileEpochMissionSpecification({
    outcome: { objective: extracted.objective ?? text },
    constraints: { metrics: constraints.filter((item) => item.target !== undefined).map((item) => ({
      metric: item.metric,
      operator: item.operator === "lte" ? "<=" : item.operator === "gte" ? ">=" : item.operator === "lt" ? "<" : item.operator === "gt" ? ">" : "=",
      target: item.target,
      unit: item.unit,
    })) },
    acceptanceCriteria: [],
  });
  const intentId = id("intent");
  const outcomeId = id("outcome");
  const missionId = id("mission");
  const correlationId = id("correlation");
  const traceId = id("trace");
  const timestamp = now.toISOString();
  const base = { contractVersion: EPOCH_CANONICAL_CONTRACT_VERSION, workspaceId: request.workspaceId, createdAt: timestamp, updatedAt: timestamp, correlation: { correlationId, traceId } };
  const intent: Intent = {
    ...base,
    id: intentId,
    actorId: request.actorId,
    source: request.source ?? "composer",
    modality: request.modality ?? "text",
    objective: extracted.objective ?? text,
    scope: {},
    constraints: constraints.map((constraint) => ({ ...constraint })),
    requestedAction: extracted.action === "unknown" ? undefined : extracted.action,
    references: refs,
    confidence: extracted.confidence,
    status: extracted.confidence >= 0.3 ? "compiled" : "needs_clarification",
  };
  const discoveryRequirements: DiscoveryRequirement[] = [];
  if (!refs.some((ref) => ref.type === "MODEL" && ref.raw !== "@model")) discoveryRequirements.push({ key: "model", reason: "No concrete model identity or revision was provided.", required: true, resolution: "discover" });
  if (!refs.some((ref) => ref.type === "WORKLOAD")) discoveryRequirements.push({ key: "workload", reason: "Workload and traffic shape are not known.", required: true, resolution: "discover" });
  if (constraints.length === 0) discoveryRequirements.push({ key: "success_metrics", reason: "No measurable target was found.", required: true, resolution: "ask" });
  if (refs.some((ref) => ref.type === "ENVIRONMENT") && !refs.some((ref) => ref.type === "OBSERVATION")) discoveryRequirements.push({ key: "observations", reason: "The environment has no observation source.", required: true, resolution: "discover" });
  const outcome: OutcomeContract = {
    ...base,
    id: outcomeId,
    objective: extracted.objective ?? text,
    baseline: {},
    targetMetrics: constraints.map((constraint) => ({ metric: constraint.metric, operator: constraint.operator, ...(constraint.target === undefined ? {} : { target: constraint.target }), ...(constraint.unit ? { unit: constraint.unit } : {}), hard: constraint.hard })),
    hardConstraints: constraints.filter((constraint) => constraint.hard).map((constraint) => ({ metric: constraint.metric, operator: constraint.operator, target: constraint.target, unit: constraint.unit })),
    softObjectives: [],
    prohibitedTradeoffs: [],
    observationWindow: { durationSeconds: 86400 },
    successCriteria: constraints.length ? constraints.map((constraint) => `${constraint.metric} ${constraint.operator}${constraint.target ?? "baseline"}${constraint.unit ?? ""}`) : ["Outcome target requires clarification"],
    verificationMethod: "independent evidence and observation verification",
    authorityRequirements: ["mission.execute"],
  };
  const mission: Mission = {
    ...base,
    id: missionId,
    title: title(text),
    objective: extracted.objective ?? text,
    state: discoveryRequirements.length ? "discovering" : "designing",
    intentId,
    outcomeContractId: outcomeId,
    environmentIds: [],
    unknownIds: [],
    hypothesisIds: [],
    candidateIds: [],
    authorityPolicyId: id("policy"),
  };
  return { intent, outcomeContract: outcome, mission, references: refs, discoveryRequirements, unresolved: specification.constraints.unresolved };
}
