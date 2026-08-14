import { createHash, randomUUID } from "node:crypto";
import { planEpochDiscovery, type EpochDiscoveryPlan, type EpochHypothesis, type EpochUnknown } from "./discoveryLoop";
import { buildEvidenceIntegrityProof, hashEvidencePayload, verifyEvidenceIntegrity } from "./evidenceIntegrity";
import { buildEpochWorldModelSnapshot, type EpochWorldFact, type EpochWorldModelSnapshot } from "./worldModel";

export const EPOCH_ARCHITECTURE_STAGES = ["customer_outcome", "current_reality", "unknown_uncertainty", "hypotheses", "capability_discovery", "system_generation", "simulation", "sandbox", "benchmark", "quality_evaluation", "economic_evaluation", "constraint_filter", "system_selection", "authorization", "execution", "observation", "evidence", "verification", "success"] as const;
export type EpochArchitectureStage = (typeof EPOCH_ARCHITECTURE_STAGES)[number];
export type EpochStageRecord = { id: string; stage: EpochArchitectureStage | "rediscovery"; status: "pending" | "running" | "completed" | "failed" | "blocked"; attempt: number; detail: string; at: string; evidenceIds: string[] };
export type EpochArchitectureEvidence = { id: string; stage: string; kind: string; payload: Record<string, unknown>; proof: ReturnType<typeof buildEvidenceIntegrityProof>; previousHash: string | null; createdAt: string };
export type EpochCapabilityRecord = { id: string; name: string; version: string | null; compatible: boolean | null; source: string; checkedAt: string; evidenceSha256: string };
export type EpochArchitectureState = { version: "epoch_architecture_runtime.v1"; missionId: string; outcome: Record<string, unknown>; stages: EpochStageRecord[]; worldModel: EpochWorldModelSnapshot; hypotheses: EpochHypothesis[]; unknowns: EpochUnknown[]; capabilities: EpochCapabilityRecord[]; checkpoints: Record<string, unknown>[]; evidence: EpochArchitectureEvidence[]; rediscovery: EpochDiscoveryPlan | null; updatedAt: string };

function sha(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function now() { return new Date().toISOString(); }
function normalizeFacts(facts: Record<string, EpochFactInput>) { return Object.fromEntries(Object.entries(facts).map(([key, value]) => [key, value])); }

type EpochFactInput = { value: unknown; source: string; confidence?: number; classification?: EpochWorldFact["classification"]; observedAt?: string };

export class EpochArchitectureRuntime {
  private readonly states = new Map<string, EpochArchitectureState>();

  createMission(input: { missionId?: string; outcome: Record<string, unknown>; facts?: Record<string, EpochFactInput>; hypotheses?: EpochHypothesis[]; unknowns?: EpochUnknown[] }): EpochArchitectureState {
    const missionId = input.missionId ?? `mission-${randomUUID()}`; const capturedAt = new Date();
    const state: EpochArchitectureState = { version: "epoch_architecture_runtime.v1", missionId, outcome: input.outcome, stages: EPOCH_ARCHITECTURE_STAGES.map((stage, index) => ({ id: `${missionId}:${stage}:1`, stage, status: index === 0 ? "running" : "pending", attempt: 1, detail: index === 0 ? "Outcome accepted" : "Waiting for predecessor", at: capturedAt.toISOString(), evidenceIds: [] })), worldModel: buildEpochWorldModelSnapshot({ facts: normalizeFacts(input.facts ?? { outcome: { value: input.outcome, source: "customer", confidence: 1, classification: "USER_ASSERTED" } }) }), hypotheses: input.hypotheses ?? [], unknowns: input.unknowns ?? [], capabilities: [], checkpoints: [], evidence: [], rediscovery: null, updatedAt: capturedAt.toISOString() };
    this.states.set(missionId, state); return this.clone(state);
  }

  get(missionId: string) { const state = this.states.get(missionId); return state ? this.clone(state) : null; }
  replay(missionId: string) { return this.get(missionId); }

  transition(missionId: string, stage: EpochArchitectureStage, input: { status: EpochStageRecord["status"]; detail: string; evidenceIds?: string[] }) {
    const state = this.require(missionId); const existing = state.stages.find((item) => item.stage === stage)!; existing.status = input.status; existing.detail = input.detail; existing.evidenceIds = [...(input.evidenceIds ?? existing.evidenceIds)]; existing.at = now(); if (input.status === "failed") this.requestRediscovery(missionId, stage, input.detail); state.updatedAt = now(); return this.clone(state);
  }

  updateWorldModel(missionId: string, facts: Record<string, EpochFactInput>, previousVersion?: number) {
    const state = this.require(missionId); const prior = state.worldModel; const merged = { ...prior.facts, ...normalizeFacts(facts) }; const version = previousVersion ?? (Number(prior.version.replace(/\D/g, "")) || 0); state.worldModel = buildEpochWorldModelSnapshot({ facts: merged, previousVersion: version }); state.updatedAt = now(); return this.clone(state);
  }

  resolveFactConflict(missionId: string, key: string, candidates: EpochWorldFact[]) {
    const state = this.require(missionId); if (!candidates.length) throw new Error("fact_candidates_required"); const selected = [...candidates].sort((a, b) => b.confidence - a.confidence || b.observedAt.localeCompare(a.observedAt))[0]; return this.updateWorldModel(missionId, { [key]: selected });
  }

  staleFacts(missionId: string, maxAgeMs: number, at = new Date()) { const state = this.require(missionId); return Object.entries(state.worldModel.facts).filter(([, fact]) => at.getTime() - new Date(fact.observedAt).getTime() > maxAgeMs).map(([key]) => key); }

  recordCapability(missionId: string, capability: Omit<EpochCapabilityRecord, "id">) { const state = this.require(missionId); state.capabilities = [...state.capabilities.filter((item) => item.name !== capability.name), { ...capability, id: `${missionId}:capability:${capability.name}` }]; state.updatedAt = now(); return this.clone(state); }

  recordCheckpoint(missionId: string, checkpoint: Record<string, unknown>) { const state = this.require(missionId); state.checkpoints.push({ ...checkpoint, recordedAt: now() }); state.updatedAt = now(); return this.clone(state); }

  appendEvidence(missionId: string, input: { stage: string; kind: string; payload: Record<string, unknown> }) { const state = this.require(missionId); const previousHash = state.evidence.at(-1)?.proof.contentHash ?? null; const proof = buildEvidenceIntegrityProof({ kind: input.kind, summary: input.stage, payload: input.payload }, { previousHash }); const item: EpochArchitectureEvidence = { id: `${missionId}:evidence:${state.evidence.length + 1}`, ...input, proof, previousHash, createdAt: now() }; state.evidence.push(item); const stage = state.stages.find((entry) => entry.stage === input.stage); if (stage) stage.evidenceIds.push(item.id); state.updatedAt = now(); return this.clone(item); }

  verifyEvidence(missionId: string) { const state = this.require(missionId); return state.evidence.map((item) => ({ id: item.id, ...verifyEvidenceIntegrity({ kind: item.kind, summary: item.stage, payload: item.payload, proof: item.proof }) })); }

  requestRediscovery(missionId: string, failedStage: string, reason: string) { const state = this.require(missionId); state.rediscovery = planEpochDiscovery({ trigger: "runtime_failure", unknowns: state.unknowns, hypotheses: state.hypotheses, failedStage, failureReason: reason }); state.stages.push({ id: `${missionId}:rediscovery:${state.stages.length + 1}`, stage: "rediscovery", status: "running", attempt: 1, detail: reason, at: now(), evidenceIds: [] }); state.updatedAt = now(); return this.clone(state.rediscovery); }

  private require(missionId: string) { const state = this.states.get(missionId); if (!state) throw new Error("mission_not_found"); return state; }
  private clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
}

export function hashEpochArchitectureState(state: EpochArchitectureState) { return sha({ ...state, updatedAt: undefined }); }
