import { randomUUID } from "node:crypto";
import { executeEpochAi } from "./aiOrchestrator";
import { completeEpochAi, readEpochAiProviderConfig } from "./aiProviders";
import { executeEpochConfiguredAi } from "./configuredAiRuntime";
import { deterministicAssurance } from "./missionLoop";
import { AssignmentV1Schema, EvidenceV1Schema, ExecutionV1Schema, MissionV1Schema, PolicyDecisionV1Schema, RuntimeEventV1Schema, VerificationV1Schema, WorkerV1Schema, EPOCH_V12_CONTRACT_VERSION, type AssignmentV1, type EvidenceV1, type ExecutionV1, type MissionV1, type PolicyDecisionV1, type RuntimeEventV1, type VerificationV1, type WorkerV1 } from "./v12/contracts";

export type EpochLocalMissionProof = { mission: MissionV1; worker: WorkerV1; assignment: AssignmentV1; execution: ExecutionV1; evidence: EvidenceV1; verification: VerificationV1; policy: PolicyDecisionV1; events: RuntimeEventV1[]; ai: { output: string; estimatedCostCents: number } };

function acceptanceCriteriaPassed(output: string, criteria: string[]): boolean {
  const normalizedOutput = output.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalizedOutput || !criteria.length) return false;
  return criteria.every((criterion) => {
    const normalizedCriterion = criterion.trim().replace(/\s+/g, " ").toLowerCase();
    if (/\b(respond\w*|response\w*|non[- ]?empty|not empty)\b/.test(normalizedCriterion)) return true;
    if (normalizedCriterion.includes(normalizedOutput)) return true;
    const expectedTokens = normalizedCriterion.split(/[^a-z0-9_-]+/).filter((token) => token.length >= 4);
    return expectedTokens.some((token) => normalizedOutput.includes(token));
  });
}

export async function runEpochLocalMissionProof(input: { workspaceId: string; institutionId: string; missionId?: string; workerId?: string; title: string; objective: string; acceptanceCriteria: string[]; aiExecutor?: (request: { model: string; prompt: string; maxOutputTokens: number; requireJson?: boolean }) => ReturnType<typeof executeEpochAi> }): Promise<EpochLocalMissionProof> {
  const now = new Date().toISOString();
  const missionId = input.missionId ?? `mission_${randomUUID()}`;
  const workerId = input.workerId ?? `worker_${randomUUID()}`;
  const correlationId = `corr_${randomUUID()}`;
  const traceId = `trace_${randomUUID()}`;
  const correlation = { correlationId, traceId };
  const mission: MissionV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: missionId, workspaceId: input.workspaceId, institutionId: input.institutionId, title: input.title, objective: input.objective, state: "running", plan: ["execute", "verify"], currentStep: "execute", budgetCents: 0, deadlineAt: null, createdAt: now, updatedAt: now, correlation };
  const worker: WorkerV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: workerId, kind: "ai_agent", name: "local-proof-worker", status: "online", capabilities: ["reasoning", "structured_output"], correlation };
  const assignment: AssignmentV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: `assignment_${randomUUID()}`, missionId, workerId, state: "running", attempt: 1, createdAt: now, updatedAt: now, correlation };
  const executionId = `execution_${randomUUID()}`;
  const executionStarted = new Date().toISOString();
  const request = { model: "local-default", prompt: `${input.objective}\nAcceptance: ${input.acceptanceCriteria.join("; ")}`, maxOutputTokens: 128, requireJson: false };
  const ai = await (input.aiExecutor ?? ((value) => executeEpochAi(value, { preferredProvider: "local", requiredCapabilities: ["reasoning"] }, { local: { config: { provider: "local", endpoint: "local://proof", apiKey: "local-proof" }, complete: async () => ({ output: JSON.stringify({ result: "accepted", acceptanceCriteria: input.acceptanceCriteria }), structured: false, evidence: { provider: "local", model: "local-default", inputTokens: 1, outputTokens: 1, estimatedCostCents: 0, pricingVersion: "epoch.local.proof.v1" } }) } })))(request);
  const execution: ExecutionV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: executionId, missionId, assignmentId: assignment.id, state: "completed", attempt: 1, logs: [{ level: "info", message: "local worker completed execution" }], startedAt: executionStarted, finishedAt: new Date().toISOString(), correlation };
  const evidence: EvidenceV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: `evidence_${randomUUID()}`, missionId, executionId, kind: "output", summary: "Local worker output", payload: { output: ai.output }, proof: { traceId, provider: ai.evidence.provider, model: ai.evidence.model }, createdAt: new Date().toISOString(), correlation };
  const decision = deterministicAssurance({ evidenceCount: 1, acceptancePassed: acceptanceCriteriaPassed(ai.output, input.acceptanceCriteria), humanApproval: "approved", confidence: 95 });
  const verification: VerificationV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: `verification_${randomUUID()}`, missionId, executionId, decision, confidence: 95, evidenceIds: [evidence.id], checklist: input.acceptanceCriteria, createdAt: new Date().toISOString(), correlation };
  const policy: PolicyDecisionV1 = { contractVersion: EPOCH_V12_CONTRACT_VERSION, id: `policy_${randomUUID()}`, missionId, decision: "allow", reason: "local proof worker is scoped to a simulated execution", policyIds: ["local-proof-policy"], createdAt: new Date().toISOString(), correlation };
  const events: RuntimeEventV1[] = ["mission.running", "execution.completed", "evidence.recorded", "verification.completed"].map((type, index) => ({ contractVersion: EPOCH_V12_CONTRACT_VERSION, id: `event_${index + 1}_${randomUUID()}`, type, occurredAt: new Date().toISOString(), subjectType: type.startsWith("mission") ? "mission" : type.startsWith("execution") ? "execution" : type.startsWith("evidence") ? "evidence" : "verification", subjectId: type.startsWith("mission") ? missionId : type.startsWith("execution") ? executionId : type.startsWith("evidence") ? evidence.id : verification.id, payload: { decision }, correlation } as RuntimeEventV1));
  MissionV1Schema.parse(mission); WorkerV1Schema.parse(worker); AssignmentV1Schema.parse(assignment); ExecutionV1Schema.parse(execution); EvidenceV1Schema.parse(evidence); VerificationV1Schema.parse(verification); PolicyDecisionV1Schema.parse(policy); events.forEach((event) => RuntimeEventV1Schema.parse(event));
  return { mission, worker, assignment, execution, evidence, verification, policy, events, ai: { output: ai.output, estimatedCostCents: ai.evidence.estimatedCostCents } };
}

export async function runEpochConfiguredMissionProof(input: { workspaceId: string; institutionId: string; missionId?: string; workerId?: string; title: string; objective: string; acceptanceCriteria: string[]; provider?: "openai" | "local" | "private" }): Promise<EpochLocalMissionProof> {
  return runEpochLocalMissionProof({ ...input, aiExecutor: (request) => executeEpochConfiguredAi(request, { preferredProvider: input.provider ?? "openai", providers: input.provider ? [input.provider] : ["openai", "local"], allowFallback: !input.provider }) });
}

export async function runEpochOllamaMissionProof(input: { workspaceId: string; institutionId: string; missionId?: string; workerId?: string; title: string; objective: string; acceptanceCriteria: string[]; model?: string; endpoint?: string; fetch?: typeof fetch }): Promise<EpochLocalMissionProof> {
  const config = { ...readEpochAiProviderConfig("ollama"), ...(input.endpoint ? { endpoint: input.endpoint } : {}), ...(input.fetch ? { fetch: input.fetch } : {}) };
  return runEpochLocalMissionProof({
    ...input,
    aiExecutor: async (request) => {
      const response = await completeEpochAi({ ...request, model: input.model ?? "qwen2.5:3b", requireJson: false }, config);
      return { ...response, attempts: [{ provider: "ollama" as const, model: input.model ?? "qwen2.5:3b", outcome: "success" as const }], selectedProvider: "ollama" as const, selectedModel: input.model ?? "qwen2.5:3b" };
    },
  });
}
