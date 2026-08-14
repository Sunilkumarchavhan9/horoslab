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
export type EvidenceTrustLevel = "OBSERVED" | "SIMULATED" | "INFERRED" | "USER_ASSERTED" | "EXTERNAL";
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

export interface EpochRecommendation {
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
  recommendation?: EpochRecommendation;
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

export interface EpochRuntimeOverview {
  activeProgramsCount: number;
  runningProgramsCount: number;
  optimizingCount: number;
  verifiedCount: number;
  liveDeploymentsCount: number;
  totalModelsAvailable: number;
  totalGpuHoursSavedPct: number;
  balanceUsd: number;
}
