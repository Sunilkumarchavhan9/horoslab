export type FutureInstructionMetric = {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  trend: string;
  filter: string;
};

export type FutureInstructionsSummary = {
  metrics: FutureInstructionMetric[];
  totals: {
    total: number;
    active: number;
    draft: number;
    review: number;
    deprecated: number;
    appliedRuns: number;
  };
};

export type FutureInstructionRow = {
  id: string;
  displayId: string;
  workspaceId: string;
  title: string;
  instruction: string;
  trigger: string;
  appliesTo: string;
  risk: string;
  riskColor: string;
  status: string;
  statusRaw: string;
  lastApplied: string | null;
  appliedRuns: number;
  impact: string;
  affectedFiles: unknown[];
  requiredTests: unknown[];
  proof: unknown;
  createdAt: string;
};

export type FutureInstructionEffectiveness = {
  range: string;
  points: Array<{
    name: string;
    success: number;
    adoption: number;
    failure: number;
    applications: number;
  }>;
  averages: {
    successLift: number;
    adoptionRate: number;
    failureRate: number;
  };
};

export type InstructionTransformation = {
  id: string;
  rawTitle: string;
  rawId: string;
  instTitle: string;
  instId: string;
  confidence: number;
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

export async function getFutureInstructionsSummary(): Promise<FutureInstructionsSummary> {
  return apiFetch<FutureInstructionsSummary>("/api/future-instructions/summary");
}

export async function listFutureInstructions(status?: string): Promise<FutureInstructionRow[]> {
  const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const payload = await apiFetch<{ instructions: FutureInstructionRow[] }>(`/api/future-instructions${suffix}`);
  return payload.instructions;
}

export async function getFutureInstruction(id: string): Promise<FutureInstructionRow> {
  const payload = await apiFetch<{ instruction: FutureInstructionRow }>(`/api/future-instructions/${encodeURIComponent(id)}`);
  return payload.instruction;
}

export async function getFutureInstructionProof(id: string): Promise<unknown> {
  const payload = await apiFetch<{ proof: unknown }>(`/api/future-instructions/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function getAppliedRuns(id: string): Promise<unknown[]> {
  const payload = await apiFetch<{ appliedRuns: unknown[] }>(`/api/future-instructions/${encodeURIComponent(id)}/applied-runs`);
  return payload.appliedRuns;
}

export async function getFutureInstructionEffectiveness(range: "7d" | "30d" | "90d"): Promise<FutureInstructionEffectiveness> {
  return apiFetch<FutureInstructionEffectiveness>(`/api/future-instructions/effectiveness?range=${range}`);
}

export async function getInstructionTransformations(): Promise<InstructionTransformation[]> {
  const payload = await apiFetch<{ transformations: InstructionTransformation[] }>("/api/future-instructions/transformations");
  return payload.transformations;
}

export async function createFutureInstruction(input: {
  workspaceId: string;
  instruction: string;
  triggerContext?: unknown;
  affectedFiles?: unknown[];
  requiredTests?: unknown[];
  riskLevel?: string;
}): Promise<unknown> {
  return apiFetch("/api/future-instructions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approveFutureInstruction(id: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export async function deprecateFutureInstruction(id: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/deprecate`, { method: "POST" });
}

export async function markFutureInstructionReview(id: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/mark-review`, { method: "POST" });
}

export async function applyFutureInstructionToRun(id: string, agentRunId?: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/apply-to-run`, {
    method: "POST",
    body: JSON.stringify({ agentRunId }),
  });
}

export async function createMistakeRuleFromFutureInstruction(id: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/create-mistake-rule`, { method: "POST" });
}

export async function createSkillCandidateFromFutureInstruction(id: string): Promise<unknown> {
  return apiFetch(`/api/future-instructions/${encodeURIComponent(id)}/create-skill-candidate`, { method: "POST" });
}

export async function exportFutureInstructions(): Promise<unknown> {
  return apiFetch("/api/future-instructions/export", { method: "POST" });
}
