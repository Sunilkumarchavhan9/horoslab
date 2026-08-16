import { createHash } from "node:crypto";
import { generateEpochCandidates, type EpochCandidate, type EpochCompatibilityStatus } from "./candidateEngine";

export type EpochCapabilityGraphNode = {
  id: string;
  kind: "model" | "runtime" | "hardware";
  label: string;
  metadata: Record<string, unknown>;
};

export type EpochCapabilityGraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: "model_runtime" | "runtime_hardware" | "candidate";
  status: EpochCompatibilityStatus;
  reasons: string[];
  evidence: string[];
};

export type EpochCapabilityCompatibilityGraph = {
  version: "epoch_capability_compatibility_graph.v1";
  nodes: EpochCapabilityGraphNode[];
  edges: EpochCapabilityGraphEdge[];
  generatedAt: string;
  evidenceSha256: string;
};

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function label(value: Record<string, unknown>, fallback: string) { return typeof value.name === "string" ? value.name : typeof value.repositoryId === "string" ? value.repositoryId : fallback; }
function nodeId(kind: string, value: Record<string, unknown>, index: number) { return `${kind}:${label(value, `${kind}-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; }

export function buildEpochCapabilityCompatibilityGraph(input: {
  model?: Record<string, unknown>;
  runtimeOptions?: Array<Record<string, unknown>>;
  hardwareOptions?: Array<Record<string, unknown>>;
  workload?: Record<string, unknown>;
  capabilityProbes?: Record<string, { reachable: boolean; models?: string[]; version?: string | null; evidenceSha256?: string }>;
  generatedAt?: Date;
}): EpochCapabilityCompatibilityGraph {
  const model = input.model ?? {};
  const runtimes = input.runtimeOptions ?? [];
  const hardware = input.hardwareOptions ?? [];
  const modelNode = { id: nodeId("model", model, 0), kind: "model" as const, label: label(model, "model"), metadata: { ...model } };
  const runtimeNodes = runtimes.map((runtime, index) => ({ id: nodeId("runtime", runtime, index), kind: "runtime" as const, label: label(runtime, "runtime"), metadata: { ...runtime } }));
  const hardwareNodes = hardware.map((machine, index) => ({ id: nodeId("hardware", machine, index), kind: "hardware" as const, label: label(machine, "hardware"), metadata: { ...machine } }));
  const candidates = generateEpochCandidates({ model, runtimeOptions: runtimes, hardwareOptions: hardware, workload: input.workload, capabilityProbes: input.capabilityProbes });
  const edges: EpochCapabilityGraphEdge[] = [];
  for (const candidate of candidates) {
    const runtimeIndex = runtimes.findIndex((runtime) => label(runtime, "runtime").toLowerCase() === label(candidate.runtime, "runtime").toLowerCase());
    const hardwareIndex = hardware.findIndex((machine) => label(machine, "hardware").toLowerCase() === label(candidate.hardware, "hardware").toLowerCase());
    const runtimeNode = runtimeNodes[runtimeIndex];
    const hardwareNode = hardwareNodes[hardwareIndex];
    if (!runtimeNode || !hardwareNode) continue;
    const edgeBase = { status: candidate.compatibility.status, reasons: candidate.compatibility.reasons, evidence: candidate.compatibility.evidence ?? [] };
    edges.push({ id: `${modelNode.id}->${runtimeNode.id}->${hardwareNode.id}`, from: modelNode.id, to: hardwareNode.id, relation: "candidate", ...edgeBase });
    edges.push({ id: `${modelNode.id}->${runtimeNode.id}`, from: modelNode.id, to: runtimeNode.id, relation: "model_runtime", ...edgeBase });
    edges.push({ id: `${runtimeNode.id}->${hardwareNode.id}`, from: runtimeNode.id, to: hardwareNode.id, relation: "runtime_hardware", ...edgeBase });
  }
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const unsigned = { version: "epoch_capability_compatibility_graph.v1" as const, nodes: [modelNode, ...runtimeNodes, ...hardwareNodes], edges, generatedAt };
  return { ...unsigned, evidenceSha256: hash(unsigned) };
}
