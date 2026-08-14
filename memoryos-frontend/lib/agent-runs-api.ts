import type {
  MasterplanAgentRunDetail,
  MasterplanAgentRunEvent,
  MasterplanFutureInstruction,
  MasterplanMemory,
  MasterplanOutcome,
  MasterplanPackage,
  MasterplanSource,
  MasterplanWorkspace,
} from "./masterplan-api";

export type AgentRunMetric = {
  key: string;
  label: string;
  value: number;
  filter: string;
};

export type AgentRunsSummary = {
  metrics: AgentRunMetric[];
  totals: {
    totalRuns: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    needsOutcome: number;
    outcomeCoverage: number;
    avgDurationMs: number;
  };
  proofLoop: string;
};

export type AgentRunBlackBox = {
  id: string;
  runId: string;
  workspaceId: string;
  contractId?: string | null;
  packageId?: string | null;
  targetAgent: string;
  status: string;
  startedAt?: string | null;
  endedAt?: string | null;
  outcomeId?: string | null;
  eventCount: number;
  proofLoop: string;
  integrityChecks: Array<{ label: string; ok: boolean; detail: string }>;
  proofSummary?: {
    pillar: string;
    promise: string;
    proofLoop: string;
    memoryCount: number;
    skillCount: number;
    fileTouchCount: number;
    toolCallCount: number;
    policyCheckCount: number;
    outcomeCaptured: boolean;
    futureInstructionCreated: boolean;
    mistakeImmunityCreated: boolean;
    replayReady: boolean;
  };
  trustChecks?: Array<{ label: string; ok: boolean; detail: string }>;
  evidence?: {
    memoryUsed?: unknown[];
    skillsRouted?: unknown[];
    filesTouched?: unknown[];
    toolsCalled?: unknown[];
    commandsRun?: unknown[];
    testsRun?: unknown[];
    policyChecks?: unknown[];
    outcome?: MasterplanOutcome | null;
    futureInstructions?: unknown[];
    mistakeImmunity?: unknown[];
    skillsCreated?: unknown[];
    replayProof?: {
      replayReady: boolean;
      stepCount: number;
      steps: unknown[];
    };
  };
  contract?: unknown;
  packageProof?: unknown;
  outcome?: MasterplanOutcome | null;
  events: MasterplanAgentRunEvent[];
  raw: unknown;
};

export type AgentRunReplay = {
  replayId: string;
  status: string;
  blackBox: AgentRunBlackBox;
  steps: Array<{
    id: string;
    type: string;
    timestamp: string;
    payload: unknown;
  }>;
};

export type SaveAgentRunOutcomeInput = {
  summary: string;
  filesChanged?: string[];
  testsPassed?: string[];
  testsFailed?: string[];
  worked?: string;
  failed?: string;
  humanCorrection?: boolean;
  futureLesson: string;
};

export type FirstLaunchProof = {
  version: string;
  title: string;
  status: string;
  workspace: MasterplanWorkspace;
  source: MasterplanSource;
  sourceItem: unknown;
  memories: MasterplanMemory[];
  package: MasterplanPackage;
  firstRun: MasterplanAgentRunDetail;
  firstOutcome: {
    outcome: MasterplanOutcome;
    futureInstruction: MasterplanFutureInstruction;
    mistakeRule: unknown;
    skillCandidate: unknown;
  };
  futureInstruction: MasterplanFutureInstruction;
  mistakeRule: unknown;
  skillCandidate: unknown;
  secondRun: MasterplanAgentRunDetail;
  secondOutcome: {
    outcome: MasterplanOutcome;
    futureInstruction: MasterplanFutureInstruction;
    mistakeRule: unknown;
    skillCandidate: unknown;
  };
  replay: AgentRunReplay;
  blackBox: AgentRunBlackBox;
  comparison: {
    firstAgent: string;
    secondAgent: string;
    mistakeRepeated: boolean;
  };
  proofLoop: string[];
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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
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

export async function getAgentRunsSummary(workspaceId?: string): Promise<AgentRunsSummary> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return apiFetch<AgentRunsSummary>(`/api/agent-runs/summary${suffix}`);
}

export async function listAgentRuns(input?: { workspaceId?: string; status?: string }): Promise<MasterplanAgentRunDetail[]> {
  const params = new URLSearchParams();
  if (input?.workspaceId) params.set("workspaceId", input.workspaceId);
  if (input?.status && input.status !== "all") params.set("status", input.status);
  const suffix = params.toString() ? `?${params}` : "";
  const payload = await apiFetch<{ runs: MasterplanAgentRunDetail[] }>(`/api/agent-runs${suffix}`);
  return payload.runs;
}

export async function getAgentRun(id: string): Promise<MasterplanAgentRunDetail> {
  const payload = await apiFetch<{ run: MasterplanAgentRunDetail }>(`/api/agent-runs/${encodeURIComponent(id)}`);
  return payload.run;
}

export async function getAgentRunTimeline(id: string): Promise<MasterplanAgentRunEvent[]> {
  const payload = await apiFetch<{ events: MasterplanAgentRunEvent[] }>(`/api/agent-runs/${encodeURIComponent(id)}/timeline`);
  return payload.events;
}

export async function getAgentRunBlackBox(id: string): Promise<AgentRunBlackBox> {
  const payload = await apiFetch<{ blackBox: AgentRunBlackBox }>(`/api/agent-runs/${encodeURIComponent(id)}/black-box`);
  return payload.blackBox;
}

export async function getAgentRunPackage(id: string): Promise<MasterplanPackage | null> {
  const payload = await apiFetch<{ package: MasterplanPackage | null }>(`/api/agent-runs/${encodeURIComponent(id)}/package`);
  return payload.package;
}

export async function getAgentRunProof(id: string): Promise<unknown> {
  const payload = await apiFetch<{ proof: unknown }>(`/api/agent-runs/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function getAgentRunOutcome(id: string): Promise<MasterplanOutcome | null> {
  const payload = await apiFetch<{ outcome: MasterplanOutcome | null }>(`/api/agent-runs/${encodeURIComponent(id)}/outcome`);
  return payload.outcome;
}

export async function createAgentRun(input: {
  workspaceId: string;
  contractId?: string | null;
  packageId?: string | null;
  agentRoleId?: string | null;
  targetAgent?: string;
  status?: string;
}): Promise<MasterplanAgentRunDetail> {
  const payload = await apiFetch<{ run: MasterplanAgentRunDetail }>("/api/agent-runs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.run;
}

export async function recordAgentRunEvent(id: string, input: { type: string; payload?: unknown; proof?: unknown }): Promise<MasterplanAgentRunEvent> {
  const payload = await apiFetch<{ event: MasterplanAgentRunEvent }>(`/api/agent-runs/${encodeURIComponent(id)}/events`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.event;
}

export async function completeAgentRun(id: string): Promise<MasterplanAgentRunDetail> {
  const payload = await apiFetch<{ run: MasterplanAgentRunDetail }>(`/api/agent-runs/${encodeURIComponent(id)}/complete`, { method: "POST" });
  return payload.run;
}

export async function failAgentRun(id: string, reason?: string): Promise<MasterplanAgentRunDetail> {
  const payload = await apiFetch<{ run: MasterplanAgentRunDetail }>(`/api/agent-runs/${encodeURIComponent(id)}/fail`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return payload.run;
}

export async function cancelAgentRun(id: string, reason?: string): Promise<MasterplanAgentRunDetail> {
  const payload = await apiFetch<{ run: MasterplanAgentRunDetail }>(`/api/agent-runs/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return payload.run;
}

export async function saveAgentRunOutcome(id: string, input: SaveAgentRunOutcomeInput): Promise<{
  outcome: MasterplanOutcome;
  futureInstruction: MasterplanFutureInstruction;
  mistakeRule: unknown;
  skillCandidate: unknown;
}> {
  return apiFetch(`/api/agent-runs/${encodeURIComponent(id)}/save-outcome`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createFutureInstructionFromRun(id: string, instruction?: string): Promise<MasterplanFutureInstruction> {
  const payload = await apiFetch<{ futureInstruction: MasterplanFutureInstruction }>(
    `/api/agent-runs/${encodeURIComponent(id)}/create-future-instruction`,
    { method: "POST", body: JSON.stringify({ instruction }) },
  );
  return payload.futureInstruction;
}

export async function createMistakeRuleFromRun(id: string, prevention?: string): Promise<unknown> {
  const payload = await apiFetch<{ mistakeRule: unknown }>(`/api/agent-runs/${encodeURIComponent(id)}/create-mistake-rule`, {
    method: "POST",
    body: JSON.stringify({ prevention }),
  });
  return payload.mistakeRule;
}

export async function createSkillCandidateFromRun(id: string, name?: string): Promise<unknown> {
  const payload = await apiFetch<{ skillCandidate: unknown }>(
    `/api/agent-runs/${encodeURIComponent(id)}/create-skill-candidate`,
    { method: "POST", body: JSON.stringify({ name }) },
  );
  return payload.skillCandidate;
}

export async function replayAgentRun(id: string): Promise<AgentRunReplay> {
  const payload = await apiFetch<{ replay: AgentRunReplay }>(`/api/agent-runs/${encodeURIComponent(id)}/replay`, { method: "POST" });
  return payload.replay;
}

export async function createFirstLaunchProof(): Promise<FirstLaunchProof> {
  const payload = await apiFetch<{ proof: FirstLaunchProof }>("/api/agent-runs/demo/first-launch-proof", { method: "POST" });
  return payload.proof;
}
