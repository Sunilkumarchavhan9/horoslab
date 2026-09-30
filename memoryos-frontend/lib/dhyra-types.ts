export type ProgramPhase =
  | "discovery"
  | "understand"
  | "hypothesize"
  | "benchmark"
  | "optimize"
  | "verify"
  | "deploy";

export type ProgramStatus =
  | "draft"
  | "discovering"
  | "hypothesizing"
  | "benchmarking"
  | "optimizing"
  | "verifying"
  | "ready"
  | "deployed"
  | "paused"
  | "failed"
  | "uncertain";
export type ExecutionDomain = "software" | "cloud" | "data_center";

export type EvidenceTrustLevel =
  | "OBSERVED"
  | "MEASURED"
  | "USER_ASSERTED"
  | "EXTERNAL"
  | "INFERRED"
  | "SIMULATED"
  | "PREDICTED"
  | "UNKNOWN"
  | "STALE"
  | "CONTRADICTED"
  | "VERIFIED";
export type VerificationVerdict =
  | "VERIFIED_SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "NOT_PROVEN"
  | "UNCERTAIN"
  | "BLOCKED"
  | "ROLLED_BACK";

export type RunType = "benchmark" | "optimization" | "verification" | "simulation" | "sandbox" | "ai_execution";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type DeploymentStatus = "live" | "stopped" | "draft" | "degraded" | "deploying";

export interface HuggingFaceIdentity {
  repositoryId: string;
  revision: string;
  commitSha: string;
  artifactDigest?: string;
  license: string;
  isGated: boolean;
  retrievedAt: string;
}

export interface CandidateMetric {
  latencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs?: number;
  costPer1kTokens: number;
  qualityScore: number;
  vramGb: number;
  throughputTokensSec: number;
  costPerMillionTokens?: number;
  powerWatts?: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  format: "FP8" | "BF16" | "INT4" | "AWQ" | "GPTQ";
  engine: "vLLM" | "SGLang" | "TensorRT-LLM" | "Ollama" | "TGI" | "Diffusers";
  hardware: string;
  executionDomain: ExecutionDomain; // Software / Cloud / Data Center
  gpuCount?: number;
  batchSize?: number;
  concurrency?: number;
  metrics: CandidateMetric;
  isBaseline?: boolean;
  isRecommended?: boolean;
  rejectionReason?: string;
  rank?: number;
  rankExplanation?: string;
  trustLevel?: EvidenceTrustLevel;
  notes?: string;
}

export interface Hypothesis {
  id: string;
  statement: string;
  status: "testing" | "confirmed" | "rejected" | "uncertain";
  confidencePct: number;
  experimentRef?: string;
  evidenceSummary: string;
}

export interface CapabilityGap {
  currentPerformance: string;
  targetPerformance: string;
  costCurrent: string;
  costTarget: string;
  gapSummary: string;
  requiredCapabilities: string[];
}

export interface WorldStateSnapshot {
  id: string;
  version: string;
  collectedAt: string;
  softwareServicesCount: number;
  cloudGpuAllocated: number;
  dataCenterGpuCapacity: number;
  policiesActiveCount: number;
  driftStatus: "STABLE" | "DRIFT_DETECTED" | "CRITICAL_DRIFT";
  stateDetails: {
    cloudRegion: string;
    dataCenterCluster: string;
    activeWorkloadTps: number;
    monthlySpendBaseline: number;
  };
}

export interface OutcomeTarget {
  objective: string;
  baselineCostMonthly: number;
  targetCostMonthly: number;
  maxP99LatencyMs: number;
  minQualityRetentionPct: number;
  downtimeAllowedSec: number;
  observationWindowHours: number;
  verdict: VerificationVerdict;
  actualCostObservedMonthly?: number;
  actualP99ObservedMs?: number;
  actualQualityObservedPct?: number;
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  durationMs?: number;
  detail?: string;
  trustLevel?: EvidenceTrustLevel;
}

export interface DhyraRecommendation {
  id: string;
  title: string;
  summary: string;
  targetCandidateId: string;
  executionDomain: ExecutionDomain;
  expectedGains: {
    latencyReductionPct: number;
    costReductionPct: number;
    qualityDeltaPct: number;
    throughputGainPct?: number;
    monthlyDollarSavings?: number;
  };
  confidencePct: number;
  evidencePoints: string[];
  suggestedActionLabel: string;
  whyThisWon: string;
  whyOthersLost: string[];
}

export interface ExperimentRun {
  id: string;
  name: string;
  candidateName: string;
  engine: string;
  hardware: string;
  executionDomain: ExecutionDomain;
  batchSize: number;
  concurrency: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  throughputTps: number;
  costPerReq: number;
  qualityRetentionPct: number;
  trustLevel: EvidenceTrustLevel;
  status: "passed" | "failed" | "running";
  timestamp: string;
}

export interface Program {
  id: string;
  name: string;
  status: ProgramStatus;
  currentPhase: ProgramPhase;
  objective: string;
  modelTarget: string;
  hfIdentity?: HuggingFaceIdentity;
  worldState: WorldStateSnapshot;
  capabilityGap: CapabilityGap;
  hypotheses: Hypothesis[];
  outcomeTarget: OutcomeTarget;
  constraints: {
    maxCostPerReq?: number;
    p95LatencyMsTarget?: number;
    p99LatencyMsTarget?: number;
    minQualityRetentionPct?: number;
    targetHardware?: string;
    allowedDomains?: ExecutionDomain[];
    allowedLicenses?: string[];
  };
  bestCandidate?: CandidateProfile;
  candidates: CandidateProfile[];
  rejectedCandidates?: CandidateProfile[];
  recommendation?: DhyraRecommendation;
  thinkingSteps: ThinkingStep[];
  experiments: ExperimentRun[];
  lastActivity: string;
  updatedAt: string;
  progressPct: number;
}

export interface ModelPricing {
  inputPricePer1M: number;
  cachedInputPricePer1M: number;
  outputPricePer1M: number;
  contextWindow: number;
  maxGeneratedOutput: number;
  ttftLimitSec: number;
  maxRequestDurationSec: number;
  perKeyConcurrency: number;
  workspaceConcurrency: number;
  workspaceTokenRatePerMin: number;
}

export interface ModelEntity {
  id: string;
  name: string;
  provider: string;
  task: string;
  parameters: string;
  contextWindow: number;
  license: string;
  format: string;
  status: "available" | "ready" | "paused" | "evaluating";
  hfIdentity?: HuggingFaceIdentity;
  bestObservedProfile: {
    engine: string;
    hardware: string;
    executionDomain: ExecutionDomain;
    p95LatencyMs: number;
    costPer1M: number;
  };
  pricing?: ModelPricing;
  capabilities: string[];
  variants: CandidateProfile[];
  description: string;
  importedFrom?: string;
  version?: string;
}

export interface RunLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "system";
  message: string;
}

export interface RunEntity {
  id: string;
  type: RunType;
  programId: string;
  programName: string;
  candidateName: string;
  environment: string;
  executionDomain: ExecutionDomain;
  status: RunStatus;
  durationSeconds: number;
  startedAt: string;
  trustLevel: EvidenceTrustLevel;
  metrics: {
    latencyP95: number;
    latencyP99?: number;
    throughputTps: number;
    gpuMemoryGb: number;
    costUsd: number;
    qualityScore: number;
  };
  logs: RunLogEntry[];
}

export interface DeploymentEntity {
  id: string;
  name: string;
  model: string;
  environment: "production" | "staging" | "edge";
  executionDomain: ExecutionDomain;
  region: string;
  status: DeploymentStatus;
  activeVersion: string;
  requests24h: number;
  p95LatencyMs: number;
  errorRatePct: number;
  cost24hUsd: number;
  endpointUrl: string;
  createdAt: string;
  hasTraffic: boolean;
  history: Array<{
    timestamp: string;
    requests: number;
    tokens: number;
    latencyMs: number;
    errors: number;
  }>;
}

export interface RegistryArtifact {
  id: string;
  name: string;
  type: "model" | "weights" | "variant" | "container" | "snapshot";
  version: string;
  source: string;
  sizeBytes: string;
  integrityHash: string;
  status: "verified" | "active" | "archived" | "building";
  createdAt: string;
  usedByPrograms: string[];
  historyTree: Array<{
    version: string;
    label: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  confidencePct: number;
  programId: string;
  programName: string;
  candidateName: string;
  verdict: VerificationVerdict;
  trustLevel: EvidenceTrustLevel;
  measurementsCount: number;
  runsCount: number;
  verificationChecksPassed: number;
  verificationChecksTotal: number;
  hardwareProfilesEvaluated: number;
  supportedByArtifacts: string[];
  claimChain: {
    claim: string;
    measurements: Array<{
      name: string;
      value: string;
      baseline: string;
      delta: string;
      trustLevel: EvidenceTrustLevel;
    }>;
    runs: Array<{ id: string; name: string; status: string; domain: ExecutionDomain }>;
    artifacts: Array<{ name: string; hash: string }>;
    verification: Array<{ rule: string; passed: boolean; details: string }>;
  };
}

export interface DhyraRuntimeOverview {
  activeProgramsCount: number;
  runningProgramsCount: number;
  optimizingCount: number;
  verifiedCount: number;
  liveDeploymentsCount: number;
  totalModelsAvailable: number;
  totalGpuHoursSavedPct: number;
  balanceUsd: number;
}

// ---------------------------------------------------------------------------
// REALITY INTELLIGENCE FABRIC TYPES
// ---------------------------------------------------------------------------

export type RealityEntityType =
  | "repository"
  | "service"
  | "api"
  | "database"
  | "model"
  | "runtime"
  | "hardware"
  | "node"
  | "cluster"
  | "cloud_resource"
  | "datacenter"
  | "workload"
  | "pipeline"
  | "deployment"
  | "incident"
  | "policy";

export interface RealityEntity {
  id: string;
  name: string;
  type: RealityEntityType;
  status: "healthy" | "degraded" | "failing" | "unknown";
  environment: "production" | "staging" | "edge" | "datacenter";
  version?: string;
  source: string;
  trustLevel: EvidenceTrustLevel;
  properties: Record<string, unknown>;
  updatedAt: string;
}

export interface RealityRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  relation:
    | "owns"
    | "contains"
    | "depends_on"
    | "deployed_on"
    | "runs"
    | "produces"
    | "consumes"
    | "located_in"
    | "compatible_with"
    | "alternative_to"
    | "observed_by"
    | "measured_by"
    | "affected_by"
    | "changed_by"
    | "verified_by";
  properties?: Record<string, unknown>;
}

export interface RealityConflict {
  id: string;
  entityId: string;
  entityName: string;
  signals: Array<{
    source: string; // e.g. "Cloud API", "Kubernetes", "Telemetry"
    claim: string;
    trustLevel: EvidenceTrustLevel;
    timestamp: string;
    isHealthy: boolean;
  }>;
  resolutionStrategy: "source_priority" | "freshness" | "cross_validation" | "experiment" | "human_gate";
  status: "active" | "investigating" | "resolved";
}

export interface DriftEvent {
  id: string;
  target: string;
  driftType: "world" | "model" | "runtime" | "workload" | "quality" | "cost" | "capacity" | "hardware";
  severity: "low" | "medium" | "critical";
  delta: string;
  detectedAt: string;
  recommendedAction: string;
  status: "detected" | "rediscovering" | "remediated" | "ignored";
}

// ---------------------------------------------------------------------------
// CAPABILITY FABRIC & SYSTEM COMPOSER TYPES
// ---------------------------------------------------------------------------

export type ModalityType =
  | "text"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "tabular"
  | "telemetry"
  | "multimodal";

export interface CapabilityNode {
  id: string;
  name: string;
  inputModalities: ModalityType[];
  outputModalities: ModalityType[];
  task: string;
  supportedRuntimes: string[];
  supportedHardware: string[];
  isVerified: boolean;
  providerCount: number;
}

export interface CandidateSystemItem {
  id: string;
  name: string;
  architecture: string[];
  components: Array<{
    role: "stt" | "retrieval" | "reranker" | "llm" | "tools" | "tts" | "custom";
    model: string;
    runtime: string;
    hardware: string;
  }>;
  predictedMetrics: {
    p95LatencyMs: number;
    costPer1kReqUsd: number;
    qualityRetentionPct: number;
    vramGb: number;
    monthlyTcoUsd: number;
  };
  paretoRank: number;
  policyStatus: "compliant" | "requires_approval" | "violates_spend";
  compatibilityScorePct: number;
}

// ---------------------------------------------------------------------------
// EXPERIMENT, BENCHMARK & SIMULATION TYPES
// ---------------------------------------------------------------------------

export interface BenchmarkMatrixRow {
  candidateId: string;
  model: string;
  runtime: string;
  hardware: string;
  batchSize: number;
  ttftMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  tokensPerSec: number;
  vramUsageGb: number;
  costPer1MTokensUsd: number;
  qualityScore: number;
  werCerRate?: number;
  taskSuccessRatePct: number;
  status: "verified" | "simulated" | "running";
}

export interface SandboxExecution {
  id: string;
  sandboxId: string;
  containerImage: string;
  resourceLimits: { cpu: string; memory: string; gpu: string; timeoutSec: number };
  status: "provisioning" | "executing" | "completed" | "destroyed";
  exitCode: number;
  logsSnippet: string[];
  capturedEvidenceDigest: string;
}

// ---------------------------------------------------------------------------
// INDEPENDENT VERIFICATION & PROOF TYPES
// ---------------------------------------------------------------------------

export interface ProofPackage {
  missionId: string;
  objective: string;
  targetOutcome: string;
  observedBaseline: string;
  testedCandidatesCount: number;
  executedInterventions: string[];
  actualConsequenceObserved: string;
  cryptographicMerkleRoot: string;
  verdict: VerificationVerdict;
  verifierSource: string;
  verifiedAt: string;
  provenance: {
    sourceInputsChecksum: string;
    worldStateVersion: string;
    evaluatorVersion: string;
    operatorSignature: string;
  };
  uncertainPoints: string[];
  nextAutonomousAction: string;
}

// ---------------------------------------------------------------------------
// GOVERNANCE, AUTHORITY & HUMAN GATE TYPES
// ---------------------------------------------------------------------------

export type AutonomyLevel = "L0_OBSERVE" | "L1_RECOMMEND" | "L2_AUTO_EXPERIMENT" | "L3_SANDBOX" | "L4_BOUNDED_PROD" | "L5_ORGANIZATIONAL_AUTONOMY";

export interface PolicyRule {
  id: string;
  name: string;
  category: "spend" | "licenses" | "regions" | "downtime" | "hardware" | "approvals";
  threshold: string;
  actionOnBreach: "DENY" | "REQUIRES_APPROVAL" | "WARN";
  isActive: boolean;
}

export interface HumanGate {
  id: string;
  missionId: string;
  missionName: string;
  gateType: "A_AMBIGUOUS_OBJECTIVE" | "B_MISSING_CONSTRAINT" | "C_HIGH_RISK_ACTION" | "D_SPEND_AUTHORITY" | "E_DESTRUCTIVE_ACTION" | "F_CONTRADICTORY_REALITY";
  reason: string;
  dhyraRecommendation: string;
  expectedImpact: string;
  rollbackPlan: string;
  requiredAuthorityLevel: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED";
}

export interface LearningRecord {
  id: string;
  initialState: string;
  intervention: string;
  resultingState: string;
  metricsDelta: {
    latencyDeltaPct: number;
    costDeltaPct: number;
    qualityDeltaPct: number;
  };
  verifiedAt: string;
  reproducibilityScorePct: number;
}

export type {
  DhyraIntent,
  RealityDomain,
  EntityReferenceType,
  EntityReference,
  CompiledOutcomeContract,
  CompiledMissionIntent,
  ComposerSuggestion,
} from "./composer/intent-compiler";

