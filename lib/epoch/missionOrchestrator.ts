import { compileEpochMissionSpecification, evaluateEpochConstraints, type EpochMissionSpecificationInput } from "./outcomeCompiler";
import { generateEpochCandidates, type EpochCandidate } from "./candidateEngine";
import { buildEpochExperimentPlans, evaluateEpochCandidate, type EpochCandidateEvaluation } from "./experimentEngine";
import { rankEpochCandidates } from "./decisionEngine";
import { buildEpochExecutionPlan } from "./executionPlan";
import { compileEpochExecutionPlan, type EpochCompiledExecutionPlan } from "./executionCompiler";
import type { EpochModelIntelligenceProfile } from "./modelIntelligence";
import type { EpochHardwareProfile, EpochRuntimeCompatibility, EpochRuntimeProfile } from "./runtimeIntelligence";

export type EpochOrchestratorStageName = "customer_outcome" | "current_reality" | "unknown_uncertainty" | "hypotheses" | "capability_gap" | "capability_discovery" | "system_generation" | "simulation" | "sandbox" | "benchmark" | "quality_evaluation" | "economic_evaluation" | "constraint_filter" | "system_selection" | "authorization" | "execution" | "observation" | "evidence" | "verification" | "success" | "rediscovery";
export type EpochOrchestratorStage = { name: EpochOrchestratorStageName; status: "completed" | "predicted" | "unknown" | "blocked"; evidenceClass: "OBSERVED" | "INFERRED" | "SIMULATED" | "USER_ASSERTED" | "UNKNOWN"; summary: string; provenance: string[] };

export type EpochMissionOrchestratorInput = EpochMissionSpecificationInput & {
  currentReality?: Record<string, unknown>;
  unknowns?: Array<{ statement: string; importance?: "low" | "medium" | "high"; impact?: "low" | "medium" | "high" }>;
  hypotheses?: Array<{ statement: string; confidence?: number }>;
  runtimeOptions?: Array<Record<string, unknown>>;
  hardwareOptions?: Array<Record<string, unknown>>;
  candidateMeasurements?: Record<string, Record<string, unknown>>;
  authorization?: { allowed: boolean; reason: string };
  verification?: { passed: boolean; evidenceIds?: string[]; summary?: string };
  executionSystem?: { profile: EpochModelIntelligenceProfile; runtime: EpochRuntimeProfile; hardware: EpochHardwareProfile; compatibility: EpochRuntimeCompatibility; executionProvider?: string; precision?: string; quantization?: string; batching?: number; concurrency?: number; timeoutMs?: number };
};

export type EpochMissionOrchestratorResult = {
  version: "epoch_mission_orchestrator.v1";
  status: "SUCCESS" | "UNCERTAIN" | "BLOCKED";
  missionSpecification: ReturnType<typeof compileEpochMissionSpecification>;
  worldState: { version: string; facts: Record<string, unknown>; provenance: Record<string, string>; capturedAt: string };
  unknowns: Array<{ statement: string; importance: string; impact: string; status: "OPEN" }>;
  hypotheses: Array<{ statement: string; priorConfidence: number; status: "UNTESTED" }>;
  capabilityGap: string[];
  candidates: EpochCandidate[];
  experimentPlans: ReturnType<typeof buildEpochExperimentPlans>;
  evaluations: EpochCandidateEvaluation[];
  decision: ReturnType<typeof rankEpochCandidates>;
  executionPlan: ReturnType<typeof buildEpochExecutionPlan> | null;
  compiledExecutionPlan: EpochCompiledExecutionPlan | null;
  stages: EpochOrchestratorStage[];
  rediscoveryRequested: boolean;
  trace: { traceId: string; generatedAt: string };
};

function stage(name: EpochOrchestratorStageName, status: EpochOrchestratorStage["status"], evidenceClass: EpochOrchestratorStage["evidenceClass"], summary: string, provenance: string[] = []): EpochOrchestratorStage {
  return { name, status, evidenceClass, summary, provenance };
}

export function runEpochMissionOrchestrator(input: EpochMissionOrchestratorInput, now = new Date()): EpochMissionOrchestratorResult {
  const traceId = `epoch-orchestrator-${now.getTime()}`;
  const specification = compileEpochMissionSpecification(input, now);
  const stages: EpochOrchestratorStage[] = [stage("customer_outcome", "completed", "USER_ASSERTED", "Outcome specification compiled", ["mission.input.outcome", "mission.input.acceptanceCriteria"])];
  const worldState = { version: `world-state-${now.toISOString()}`, facts: { ...(input.currentReality ?? {}), model: specification.model, baseline: specification.baseline, workload: specification.workload }, provenance: { ...Object.fromEntries(Object.keys(input.currentReality ?? {}).map((key) => [`facts.${key}`, "user_or_connector_observation"])), model: "mission.model", baseline: "mission.baseline", workload: "mission.workload" }, capturedAt: now.toISOString() };
  stages.push(stage("current_reality", Object.keys(input.currentReality ?? {}).length ? "completed" : "unknown", Object.keys(input.currentReality ?? {}).length ? "OBSERVED" : "UNKNOWN", Object.keys(input.currentReality ?? {}).length ? "Current reality captured" : "Current reality is incomplete", ["world-state.v1"]));
  const unknowns = [...(input.unknowns ?? []), ...(specification.readiness !== "ready" ? [{ statement: `Mission readiness is ${specification.readiness}`, importance: "high" as const, impact: "high" as const }] : [])].map((item) => ({ statement: item.statement, importance: item.importance ?? "medium", impact: item.impact ?? "medium", status: "OPEN" as const }));
  stages.push(stage("unknown_uncertainty", unknowns.length ? "unknown" : "completed", unknowns.length ? "UNKNOWN" : "OBSERVED", unknowns.length ? `${unknowns.length} unknowns remain open` : "No blocking unknowns declared", ["mission.unknowns"]));
  const hypotheses = (input.hypotheses ?? [{ statement: "A compatible runtime and available hardware can satisfy the outcome constraints.", confidence: 0.5 }]).map((item) => ({ statement: item.statement, priorConfidence: Math.max(0, Math.min(1, item.confidence ?? 0.5)), status: "UNTESTED" as const }));
  stages.push(stage("hypotheses", "completed", "INFERRED", `${hypotheses.length} hypotheses registered`, ["mission.hypotheses"]));
  const capabilityGap = [!input.runtimeOptions?.length ? "runtime" : null, !input.hardwareOptions?.length ? "hardware" : null, !Object.keys(specification.workload).length ? "workload" : null].filter((item): item is string => Boolean(item));
  stages.push(stage("capability_gap", capabilityGap.length ? "unknown" : "completed", capabilityGap.length ? "UNKNOWN" : "INFERRED", capabilityGap.length ? `Missing capabilities: ${capabilityGap.join(", ")}` : "Required runtime and hardware capability inputs exist", ["capability-fabric"]));
  const candidates = generateEpochCandidates({ model: specification.model, runtimeOptions: input.runtimeOptions, hardwareOptions: input.hardwareOptions, workload: specification.workload });
  stages.push(stage("capability_discovery", candidates.length ? "completed" : "blocked", candidates.length ? "OBSERVED" : "UNKNOWN", `${candidates.length} candidate capability combinations generated`, ["runtime-fabric", "hardware-fabric"]));
  stages.push(stage("system_generation", candidates.length ? "completed" : "blocked", "INFERRED", candidates.length ? "Complete candidate systems generated" : "No candidate system can be generated", ["candidate-engine"]));
  stages.push(stage("simulation", candidates.length ? "predicted" : "blocked", candidates.length ? "SIMULATED" : "UNKNOWN", candidates.length ? "Analytical simulation placeholder recorded; not observed evidence" : "Simulation blocked by missing candidates", ["simulation.v1"]));
  const experimentPlans = buildEpochExperimentPlans({ candidates, workload: specification.workload });
  stages.push(stage("sandbox", experimentPlans.length ? "completed" : "blocked", experimentPlans.length ? "INFERRED" : "UNKNOWN", `${experimentPlans.length} sandbox experiment plans prepared`, ["experiment-engine", "sandbox-policy"]));
  stages.push(stage("benchmark", input.candidateMeasurements ? "completed" : "unknown", input.candidateMeasurements ? "OBSERVED" : "UNKNOWN", input.candidateMeasurements ? "Measured candidate results supplied" : "Awaiting benchmark measurements", ["benchmark-observation"]));
  const evaluations = candidates.map((candidate) => evaluateEpochCandidate({ candidateId: candidate.id, baseline: specification.baseline, measurements: input.candidateMeasurements?.[candidate.id], hardConstraints: specification.constraints.hard, monthlyRequests: Number(specification.workload.monthlyRequests) }));
  stages.push(stage("quality_evaluation", evaluations.some((evaluation) => evaluation.quality.measured !== null) ? "completed" : "unknown", evaluations.some((evaluation) => evaluation.quality.measured !== null) ? "OBSERVED" : "UNKNOWN", "Quality evaluation derived from candidate measurements", ["quality-evaluator"]));
  stages.push(stage("economic_evaluation", evaluations.some((evaluation) => evaluation.economics.costPerRequest !== null) ? "completed" : "unknown", evaluations.some((evaluation) => evaluation.economics.costPerRequest !== null) ? "OBSERVED" : "UNKNOWN", "Economic evaluation derived from measured request cost", ["economic-evaluator"]));
  stages.push(stage("constraint_filter", evaluations.length ? "completed" : "blocked", "INFERRED", "Hard constraints evaluated for every candidate", ["constraint-engine"]));
  const decision = rankEpochCandidates({ evaluations, objectives: [{ metric: "quality", direction: "maximize", weight: 0.5 }, { metric: "p99", direction: "minimize", weight: 0.3 }, { metric: "costPerRequest", direction: "minimize", weight: 0.2 }], now });
  stages.push(stage("system_selection", decision.winner ? "completed" : "unknown", decision.winner ? "INFERRED" : "UNKNOWN", decision.explanation, ["decision-engine"]));
  const authorization = input.authorization ?? { allowed: false, reason: "Explicit authorization is required before execution" };
  stages.push(stage("authorization", authorization.allowed ? "completed" : "blocked", authorization.allowed ? "USER_ASSERTED" : "UNKNOWN", authorization.reason, ["authority-policy"]));
  const executionPlan = decision.winner && authorization.allowed ? buildEpochExecutionPlan({ candidateId: decision.winner.candidateId }) : null;
  const compiledExecutionPlan = decision.winner && authorization.allowed && input.executionSystem
    ? compileEpochExecutionPlan({ ...input.executionSystem })
    : null;
  if (compiledExecutionPlan) stages.push(stage("execution", compiledExecutionPlan.status === "BLOCKED" ? "blocked" : compiledExecutionPlan.status === "NEEDS_EXPERIMENT" ? "unknown" : "completed", compiledExecutionPlan.status === "READY" ? "INFERRED" : "UNKNOWN", `Deterministic system plan ${compiledExecutionPlan.status.toLowerCase()} (${compiledExecutionPlan.identity.slice(0, 12)})`, ["execution-plan.v2", compiledExecutionPlan.identity]));
  stages.push(stage("execution", executionPlan ? "completed" : "blocked", executionPlan ? "INFERRED" : "UNKNOWN", executionPlan ? "Bounded execution plan prepared" : "Execution is blocked until a winner and authorization exist", ["execution-plan"]));
  const verificationPassed = input.verification?.passed === true;
  const verificationFailed = input.verification?.passed === false;
  for (const name of ["observation", "evidence", "verification"] as const) stages.push(stage(name, verificationPassed ? "completed" : executionPlan ? "unknown" : "blocked", verificationPassed ? "OBSERVED" : "UNKNOWN", verificationPassed ? (input.verification?.summary ?? "Observed evidence passed verification") : executionPlan ? "Awaiting execution observations and verification" : "Not reached", ["verification-gate"]));
  const rediscoveryRequested = decision.status !== "DECIDED" || !authorization.allowed || verificationFailed;
  const succeeded = decision.status === "DECIDED" && authorization.allowed && verificationPassed;
  stages.push(stage(succeeded ? "success" : "rediscovery", succeeded ? "completed" : "unknown", succeeded ? "OBSERVED" : "UNKNOWN", succeeded ? "Outcome verified successfully" : verificationFailed ? "Verification failed; discovery must restart" : "Execution or verification evidence is still required", ["failure-loop"]));
  return { version: "epoch_mission_orchestrator.v1", status: succeeded ? "SUCCESS" : capabilityGap.length || unknowns.length || executionPlan ? "UNCERTAIN" : "BLOCKED", missionSpecification: specification, worldState, unknowns, hypotheses, capabilityGap, candidates, experimentPlans, evaluations, decision, executionPlan, compiledExecutionPlan, stages, rediscoveryRequested, trace: { traceId, generatedAt: now.toISOString() } };
}
