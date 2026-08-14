const MASTERPLAN_BASE = "/api/masterplan";

export type MasterplanWorkspace = {
  id: string;
  name: string;
  ownerId: string;
  plan: string;
  region: string;
  createdAt: string;
};

export type MasterplanSource = {
  id: string;
  workspaceId: string;
  provider: string;
  type: string;
  status: string;
  lastSyncedAt?: string | null;
  createdAt: string;
};

export type MasterplanMemory = {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  summary: string;
  content: string;
  proof: unknown;
  confidenceScore: number;
  freshnessScore: number;
  qualityScore: number;
  riskLevel: string;
  status: string;
  createdAt: string;
};

export type MemoryIgnitionPrepareResponse = {
  contract?: MasterplanInheritanceContract;
  preview: Record<string, unknown>;
  threeThings: string[];
};

export type MasterplanInheritanceContract = {
  id: string;
  workspaceId: string;
  task: string;
  targetAgent: string;
  targetFormat: string;
  memory: unknown;
  rules: unknown;
  risks: unknown;
  requiredTests: unknown;
  permissions: unknown;
  approvedSkills: unknown;
  blockedActions: unknown;
  proof: unknown;
  outcomeSchema: unknown;
  status: string;
  readinessScore: number;
  memoryQuality: number;
  riskLevel: string;
  sourceType: string;
  sourceRef?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MasterplanPackage = {
  id: string;
  workspaceId: string;
  contractId?: string | null;
  task: string;
  targetAgent: string;
  targetFormat: string;
  autonomyLevel: string;
  safetyMode: string;
  agentReadinessScore: number;
  memoryQualityScore: number;
  reliabilityScore: number;
  payload: Record<string, unknown>;
  proof: Record<string, unknown>;
  createdAt: string;
  contract?: MasterplanInheritanceContract | null;
};

export type MasterplanAgentRunEvent = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  type: string;
  payload: Record<string, unknown>;
  proof: Record<string, unknown>;
  timestamp: string;
};

export type MasterplanAgentRun = {
  id: string;
  workspaceId: string;
  contractId?: string | null;
  packageId?: string | null;
  targetAgent: string;
  status: string;
  cost: number;
  startedAt: string;
  endedAt?: string | null;
  outcomeId?: string | null;
};

export type MasterplanAgentRunDetail = MasterplanAgentRun & {
  events?: MasterplanAgentRunEvent[];
  outcome?: MasterplanOutcome | null;
  inheritanceContract?: MasterplanInheritanceContract | null;
  inheritancePackage?: MasterplanPackage | null;
};

export type MasterplanOutcome = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  summary: string;
  futureLesson: string;
  createdAt: string;
};

export type MasterplanFutureInstruction = {
  id: string;
  workspaceId: string;
  instruction: string;
  status: string;
  riskLevel: string;
  createdAt: string;
};

export type MasterplanRoutedSkill = {
  id: string;
  name: string;
  domain: string;
  version: string;
  status: string;
  installed: boolean;
  qualityScore: number;
  successRate: number;
  score: number;
  whySelected: string;
  matchedSignals: string[];
  requiredTools: string[];
  requiredTests: string[];
  approvalRules: string[];
  trigger: unknown;
  routerRuleId?: string | null;
};

export type MasterplanBlackBoxRecord = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  contractId?: string | null;
  packageId?: string | null;
  task: string;
  proof: unknown;
  createdAt: string;
};

export type MasterplanExperienceGraph = {
  nodes: Array<{
    id: string;
    workspaceId: string;
    type: string;
    refId: string;
    label: string;
    metadata: unknown;
    createdAt: string;
  }>;
  edges: Array<{
    id: string;
    workspaceId: string;
    fromNodeId: string;
    toNodeId: string;
    type: string;
    proof: unknown;
    weight: number;
    createdAt: string;
  }>;
  summary: {
    nodes: number;
    edges: number;
    byType: Record<string, number>;
  };
};

export type MasterplanWorkflowBlueprint = {
  id: string;
  workspaceId: string;
  name: string;
  trigger: unknown;
  steps: unknown;
  requiredMemories: unknown;
  requiredTools: unknown;
  riskChecks: unknown;
  approvalRules: unknown;
  successCriteria: unknown;
  outcomeSchema: unknown;
  createdAt: string;
};

export type MasterplanEvaluationRun = {
  id: string;
  workspaceId: string;
  contractId?: string | null;
  name: string;
  task: string;
  agent: string;
  baselinePrompt?: string;
  inheritancePackageId?: string | null;
  baselineAgentRunId?: string | null;
  inheritedAgentRunId?: string | null;
  status: string;
  metrics: unknown;
  proof: unknown;
  createdAt: string;
};

export type MasterplanEvaluationResult = {
  id: string;
  workspaceId: string;
  evaluationRunId: string;
  success: boolean;
  inheritanceLift: number;
  testsRememberedScore: number;
  riskDetectionScore: number;
  humanCorrectionRequired: boolean;
  mistakesRepeated: number;
  costPerSuccessfulTask: number;
  qualityScore: number;
  proof: unknown;
  createdAt: string;
};

export type MasterplanEvaluationReplaySummary = {
  version: string;
  primaryPromise: string;
  latestRun: MasterplanEvaluationRun | null;
  latestResult: MasterplanEvaluationResult | null;
  totals: {
    evaluationRuns: number;
    results: number;
    successfulResults: number;
    proofCoverage: number;
  };
  metrics: {
    primaryMetric: string;
    mistakeRepeatRateBefore: number;
    mistakeRepeatRateAfter: number;
    inheritanceLift: number;
    testsRememberedScore: number;
    riskDetectionScore: number;
    humanCorrectionRequired: boolean;
    mistakesRepeated: number;
    qualityScore: number;
  };
  proof: {
    promiseProven: boolean;
    baselineAgentRunId?: string | null;
    inheritedAgentRunId?: string | null;
    baselineOutcomeId?: string | null;
    inheritedOutcomeId?: string | null;
    contractId?: string | null;
    replayProof: unknown[];
    lineage: string;
  };
};

export type MasterplanModelProvider = {
  id: string;
  workspaceId: string;
  provider: string;
  displayName: string;
  status: string;
  defaultModel?: string | null;
  monthlyBudget?: number | null;
  createdAt: string;
};

export type MasterplanModelUsage = {
  events: Array<{
    id: string;
    workspaceId: string;
    providerId?: string | null;
    agentRunId?: string | null;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    success: boolean;
    createdAt: string;
  }>;
  totals: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    successful: number;
    total: number;
  };
};

export type MasterplanCostSummary = {
  events: Array<{
    id: string;
    workspaceId: string;
    category: string;
    amount: number;
    currency: string;
    savedByInheritance: number;
    createdAt: string;
  }>;
  totals: {
    amount: number;
    savedByInheritance: number;
    currency: string;
  };
};

export type MasterplanComplianceEvidence = {
  id: string;
  workspaceId: string;
  domain: string;
  title: string;
  sourceType: string;
  sourceRef?: string | null;
  status: string;
  proof: unknown;
  createdAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

async function masterplanFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MASTERPLAN_BASE}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  return readJson<T>(response);
}

export async function listMasterplanWorkspaces(): Promise<MasterplanWorkspace[]> {
  const payload = await masterplanFetch<{ workspaces: MasterplanWorkspace[] }>("/workspaces");
  return payload.workspaces;
}

export async function createMasterplanWorkspace(input: {
  name: string;
  plan?: string;
  region?: string;
}): Promise<MasterplanWorkspace> {
  const payload = await masterplanFetch<{ workspace: MasterplanWorkspace }>("/workspaces", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.workspace;
}

export async function createMasterplanSource(input: {
  workspaceId: string;
  provider: string;
  type: string;
}): Promise<MasterplanSource> {
  const payload = await masterplanFetch<{ source: MasterplanSource }>("/sources", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.source;
}

export async function createMasterplanSourceItem(input: {
  sourceId: string;
  workspaceId: string;
  type: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  const payload = await masterplanFetch<{ item: unknown }>(`/sources/${encodeURIComponent(input.sourceId)}/items`, {
    method: "POST",
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      type: input.type,
      title: input.title,
      content: input.content,
      metadata: input.metadata,
      extractMemory: true,
    }),
  });
  return payload.item;
}

export async function listMasterplanMemories(workspaceId: string): Promise<MasterplanMemory[]> {
  const payload = await masterplanFetch<{ memories: MasterplanMemory[] }>(`/memories?workspaceId=${encodeURIComponent(workspaceId)}`);
  return payload.memories;
}

export async function prepareMemoryIgnitionPackage(input: {
  workspaceId: string;
  task: string;
  targetAgent: string;
  targetFormat: string;
  autonomyLevel: string;
  safetyMode: string;
}): Promise<MemoryIgnitionPrepareResponse> {
  return masterplanFetch<MemoryIgnitionPrepareResponse>("/memoryignition/prepare", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function routeMasterplanSkills(input: {
  workspaceId: string;
  task: string;
  limit?: number;
}): Promise<{
  skills: MasterplanRoutedSkill[];
  proof: Record<string, unknown>;
}> {
  return masterplanFetch("/skill-router/route", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createMemoryIgnitionPackage(input: {
  workspaceId: string;
  task: string;
  targetAgent: string;
  targetFormat: string;
  autonomyLevel: string;
  safetyMode: string;
}): Promise<MasterplanPackage> {
  const payload = await masterplanFetch<{ package: MasterplanPackage }>("/memoryignition/package", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.package;
}

export async function listMasterplanPackages(workspaceId?: string): Promise<MasterplanPackage[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ packages: MasterplanPackage[] }>(`/packages${suffix}`);
  return payload.packages;
}

export async function sendMemoryIgnitionPackage(packageId: string): Promise<MasterplanAgentRun> {
  const payload = await masterplanFetch<{ run: MasterplanAgentRun }>("/memoryignition/send-now", {
    method: "POST",
    body: JSON.stringify({ packageId }),
  });
  return payload.run;
}

export async function listMasterplanAgentRuns(workspaceId?: string): Promise<MasterplanAgentRunDetail[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ runs: MasterplanAgentRunDetail[] }>(`/agent-runs${suffix}`);
  return payload.runs;
}

export async function getMasterplanAgentRun(runId: string): Promise<MasterplanAgentRunDetail> {
  const payload = await masterplanFetch<{ run: MasterplanAgentRunDetail }>(`/agent-runs/${encodeURIComponent(runId)}`);
  return payload.run;
}

export async function getMasterplanAgentRunTimeline(runId: string): Promise<MasterplanAgentRunEvent[]> {
  const payload = await masterplanFetch<{ events: MasterplanAgentRunEvent[] }>(
    `/agent-runs/${encodeURIComponent(runId)}/timeline`,
  );
  return payload.events;
}

export async function saveMasterplanOutcome(input: {
  agentRunId: string;
  summary: string;
  filesChanged: string[];
  testsPassed: string[];
  testsFailed: string[];
  worked: string;
  failed: string;
  humanCorrection: boolean;
  futureLesson: string;
}): Promise<{ outcome: MasterplanOutcome; futureInstruction: MasterplanFutureInstruction }> {
  return masterplanFetch<{ outcome: MasterplanOutcome; futureInstruction: MasterplanFutureInstruction }>("/outcomes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listFutureInstructions(workspaceId: string): Promise<MasterplanFutureInstruction[]> {
  const payload = await masterplanFetch<{ futureInstructions: MasterplanFutureInstruction[] }>(
    `/future-instructions?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  return payload.futureInstructions;
}

export async function approveFutureInstruction(id: string): Promise<MasterplanFutureInstruction> {
  const payload = await masterplanFetch<{ futureInstruction: MasterplanFutureInstruction }>(
    `/future-instructions/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );
  return payload.futureInstruction;
}

export async function getMasterplanExperienceGraph(workspaceId?: string): Promise<MasterplanExperienceGraph> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return masterplanFetch<MasterplanExperienceGraph>(`/agent-experience-graph${suffix}`);
}

export async function buildMasterplanExperienceGraphFromRun(runId: string): Promise<MasterplanExperienceGraph> {
  return masterplanFetch<MasterplanExperienceGraph>(`/agent-experience-graph/from-run/${encodeURIComponent(runId)}`, {
    method: "POST",
  });
}

export async function createMasterplanBlackBoxRecord(agentRunId: string): Promise<{
  blackBoxRecord: MasterplanBlackBoxRecord;
  complianceEvidence: MasterplanComplianceEvidence;
}> {
  return masterplanFetch("/agent-black-box/record", {
    method: "POST",
    body: JSON.stringify({ agentRunId }),
  });
}

export async function getMasterplanBlackBoxRecord(agentRunId: string): Promise<MasterplanBlackBoxRecord> {
  const payload = await masterplanFetch<{ blackBoxRecord: MasterplanBlackBoxRecord }>(
    `/agent-black-box/${encodeURIComponent(agentRunId)}`,
  );
  return payload.blackBoxRecord;
}

export async function listMasterplanBlueprints(workspaceId?: string): Promise<MasterplanWorkflowBlueprint[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ blueprints: MasterplanWorkflowBlueprint[] }>(`/blueprints${suffix}`);
  return payload.blueprints;
}

export async function createMasterplanBlueprint(input: {
  workspaceId: string;
  name: string;
  trigger?: unknown;
  steps?: unknown;
  requiredMemories?: unknown;
  requiredTools?: unknown;
  riskChecks?: unknown;
  approvalRules?: unknown;
  successCriteria?: unknown;
  outcomeSchema?: unknown;
}): Promise<MasterplanWorkflowBlueprint> {
  const payload = await masterplanFetch<{ blueprint: MasterplanWorkflowBlueprint }>("/blueprints", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.blueprint;
}

export async function runMasterplanBlueprint(id: string, input?: {
  workspaceId?: string;
  task?: string;
  targetAgent?: string;
}): Promise<{ blueprint: MasterplanWorkflowBlueprint; package: MasterplanPackage; run: MasterplanAgentRun }> {
  return masterplanFetch(`/blueprints/${encodeURIComponent(id)}/run`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function listMasterplanEvaluationRuns(workspaceId?: string): Promise<MasterplanEvaluationRun[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ evaluationRuns: MasterplanEvaluationRun[] }>(`/evaluation${suffix}`);
  return payload.evaluationRuns;
}

export async function getMasterplanEvaluationSummary(workspaceId?: string): Promise<MasterplanEvaluationReplaySummary> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ summary: MasterplanEvaluationReplaySummary }>(`/evaluation/summary${suffix}`);
  return payload.summary;
}

export async function createMasterplanEvaluationRun(input: {
  workspaceId: string;
  contractId?: string | null;
  name?: string;
  task?: string;
  agent?: string;
  baselinePrompt?: string;
  inheritancePackageId?: string | null;
}): Promise<{ evaluationRun: MasterplanEvaluationRun; result: MasterplanEvaluationResult }> {
  return masterplanFetch("/evaluation/run", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMasterplanEvaluationResults(id: string): Promise<{
  evaluationRun: MasterplanEvaluationRun;
  results: MasterplanEvaluationResult[];
}> {
  return masterplanFetch(`/evaluation/${encodeURIComponent(id)}/results`);
}

export async function listMasterplanModelProviders(workspaceId?: string): Promise<MasterplanModelProvider[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ modelProviders: MasterplanModelProvider[] }>(`/model-providers${suffix}`);
  return payload.modelProviders;
}

export async function connectMasterplanModelProvider(input: {
  workspaceId: string;
  provider: string;
  displayName?: string;
  defaultModel?: string | null;
  monthlyBudget?: number | null;
}): Promise<MasterplanModelProvider> {
  const payload = await masterplanFetch<{ modelProvider: MasterplanModelProvider }>("/model-providers/connect", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.modelProvider;
}

export async function getMasterplanModelUsage(workspaceId?: string): Promise<MasterplanModelUsage> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return masterplanFetch<MasterplanModelUsage>(`/model-usage${suffix}`);
}

export async function getMasterplanCostSummary(workspaceId?: string): Promise<MasterplanCostSummary> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return masterplanFetch<MasterplanCostSummary>(`/cost${suffix}`);
}

export async function listMasterplanComplianceEvidence(workspaceId?: string): Promise<MasterplanComplianceEvidence[]> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const payload = await masterplanFetch<{ evidence: MasterplanComplianceEvidence[] }>(`/compliance/evidence${suffix}`);
  return payload.evidence;
}
