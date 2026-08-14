import type {
  MasterplanAgentRun,
  MasterplanAgentRunEvent,
  MasterplanFutureInstruction,
  MasterplanMemory,
  MasterplanOutcome,
  MasterplanPackage,
  MasterplanWorkspace,
  MemoryIgnitionPrepareResponse,
} from "./masterplan-api";

export type MemoryIgnitionPolicyGate = {
  status: "allow" | "blocked";
  reasons: string[];
  checks: Array<{
    label: string;
    status: string;
    count?: number;
  }>;
};

export type MemoryIgnitionState = {
  workspace: MasterplanWorkspace | null;
  memories: MasterplanMemory[];
  packages: MasterplanPackage[];
  runs: Array<MasterplanAgentRun & { events?: MasterplanAgentRunEvent[] }>;
  futureInstructions: MasterplanFutureInstruction[];
  latestPackage: MasterplanPackage | null;
  latestRun: (MasterplanAgentRun & { events?: MasterplanAgentRunEvent[] }) | null;
  metrics: {
    agentReadiness: number;
    memoryQuality: number;
    policyCheck: number;
    requiredTests: number;
    riskWarnings: number;
  };
  policyGate: MemoryIgnitionPolicyGate;
  connection: {
    mcp: "ready" | "needs_setup";
    api: "ready" | "needs_setup";
  };
  proofLoop: string;
};

export type MemoryIgnitionPackageInput = {
  workspaceId: string;
  contractId?: string | null;
  task: string;
  targetAgent: string;
  targetFormat: string;
  autonomyLevel: string;
  safetyMode: string;
};

export type MemoryIgnitionOutcomeResult = {
  outcome: MasterplanOutcome;
  futureInstruction: MasterplanFutureInstruction;
  mistakeRule: {
    id: string;
    workspaceId: string;
    status: string;
    trigger: string;
    prevention: string;
    proof: Record<string, unknown>;
  };
  skillCandidate: {
    id: string;
    workspaceId: string;
    name: string;
    status: string;
    successRate?: number;
    version?: string;
  };
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

export function getMemoryIgnitionState(workspaceId?: string | null): Promise<MemoryIgnitionState> {
  const suffix = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return apiFetch<MemoryIgnitionState>(`/api/memoryignition/state${suffix}`);
}

export function prepareMemoryIgnitionPackage(input: MemoryIgnitionPackageInput): Promise<MemoryIgnitionPrepareResponse> {
  return apiFetch<MemoryIgnitionPrepareResponse>("/api/memoryignition/prepare", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createMemoryIgnitionPackage(input: MemoryIgnitionPackageInput): Promise<MasterplanPackage> {
  const payload = await apiFetch<{ package: MasterplanPackage }>("/api/memoryignition/package", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.package;
}

export async function sendMemoryIgnitionPackage(packageId: string): Promise<MasterplanAgentRun> {
  const payload = await apiFetch<{ run: MasterplanAgentRun }>("/api/memoryignition/send-now", {
    method: "POST",
    body: JSON.stringify({ packageId }),
  });
  return payload.run;
}

export async function getPackagePrompt(packageId: string): Promise<string> {
  const payload = await apiFetch<{ prompt: string }>(`/api/packages/${encodeURIComponent(packageId)}/prompt`);
  return payload.prompt;
}

export async function getPackageJson(packageId: string): Promise<Record<string, unknown>> {
  const payload = await apiFetch<{ payload: Record<string, unknown> }>(`/api/packages/${encodeURIComponent(packageId)}/json`);
  return payload.payload;
}

export async function getPackageProof(packageId: string): Promise<Record<string, unknown>> {
  const payload = await apiFetch<{ proof: Record<string, unknown> }>(`/api/packages/${encodeURIComponent(packageId)}/proof`);
  return payload.proof;
}

export async function recordPromptCopy(packageId: string): Promise<{ recorded: boolean; event?: MasterplanAgentRunEvent | null }> {
  return apiFetch<{ recorded: boolean; event?: MasterplanAgentRunEvent | null }>(
    `/api/packages/${encodeURIComponent(packageId)}/copy-event`,
    { method: "POST" },
  );
}

export function saveMemoryIgnitionOutcome(input: {
  agentRunId: string;
  summary: string;
  filesChanged: string[];
  testsPassed: string[];
  testsFailed: string[];
  worked: string;
  failed: string;
  humanCorrection: boolean;
  futureLesson: string;
}): Promise<MemoryIgnitionOutcomeResult> {
  return apiFetch<MemoryIgnitionOutcomeResult>("/api/outcomes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
