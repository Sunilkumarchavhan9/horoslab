export type MistakeImmunityMetric = {
  key: string;
  label: string;
  value: number;
  trend: string;
  filter: string;
};

export type MistakeImmunitySummary = {
  metrics: MistakeImmunityMetric[];
  totals: {
    total: number;
    active: number;
    candidates: number;
    requiredTestUpdates: number;
    riskUpdates: number;
    mistakesAvoided: number;
    triggers: number;
  };
};

export type MistakeImmunityRuleRow = {
  id: string;
  displayId: string;
  workspaceId: string;
  pattern: string;
  risk: string;
  riskLevel: string;
  riskColor: string;
  triggerContext: string;
  triggerContextRaw: unknown;
  instruction: string;
  riskyFiles: string[];
  requiredTests: string[];
  approval: string;
  approvalRisk: string;
  status: string;
  statusRaw: string;
  sourceType: string;
  sourceRef: string | null;
  proof: unknown;
  mistakesAvoided: number;
  triggerCount: number;
  replayTestCount: number;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TopRepeatedMistake = {
  id: string;
  name: string;
  count: number;
  riskLevel: string;
};

export type ProtectionImpact = {
  range: string;
  points: Array<{ name: string; avoided: number; rules: number }>;
  totals: {
    mistakesAvoided: number;
    activeRules: number;
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
  const response = await fetch(`/api/mistake-immunity${path}`, {
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

export async function getMistakeImmunitySummary(): Promise<MistakeImmunitySummary> {
  return apiFetch<MistakeImmunitySummary>("/summary");
}

export async function listMistakeImmunityRules(status?: string): Promise<MistakeImmunityRuleRow[]> {
  const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const payload = await apiFetch<{ rules: MistakeImmunityRuleRow[] }>(`/rules${suffix}`);
  return payload.rules;
}

export async function getMistakeImmunityRule(id: string): Promise<MistakeImmunityRuleRow> {
  const payload = await apiFetch<{ rule: MistakeImmunityRuleRow }>(`/rules/${encodeURIComponent(id)}`);
  return payload.rule;
}

export async function getMistakeImmunityRuleProof(id: string): Promise<unknown> {
  const payload = await apiFetch<{ proof: unknown }>(`/rules/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function getMistakeRuleTriggers(id: string): Promise<unknown[]> {
  const payload = await apiFetch<{ triggers: unknown[] }>(`/rules/${encodeURIComponent(id)}/triggers`);
  return payload.triggers;
}

export async function getTopRepeatedMistakes(): Promise<TopRepeatedMistake[]> {
  const payload = await apiFetch<{ mistakes: TopRepeatedMistake[] }>("/top-repeated-mistakes");
  return payload.mistakes;
}

export async function getProtectionImpact(range: "7d" | "30d" | "90d" = "30d"): Promise<ProtectionImpact> {
  return apiFetch<ProtectionImpact>(`/protection-impact?range=${range}`);
}

type MistakeRuleWriteInput = Omit<Partial<MistakeImmunityRuleRow>, "triggerContext"> & {
  preventionInstruction?: string;
  triggerContext?: unknown;
  riskCategory?: string;
  approvalRequirement?: string;
  status?: string;
};

export async function createMistakeRule(input: MistakeRuleWriteInput): Promise<unknown> {
  return apiFetch("/rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approveMistakeRule(id: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export async function editMistakeRule(id: string, input: MistakeRuleWriteInput): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/edit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deprecateMistakeRule(id: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/deprecate`, { method: "POST" });
}

export async function attachMistakeRuleTest(id: string, test: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/attach-test`, {
    method: "POST",
    body: JSON.stringify({ test, command: test }),
  });
}

export async function attachMistakeRuleApproval(id: string, approval: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/attach-approval`, {
    method: "POST",
    body: JSON.stringify({ approval }),
  });
}

export async function runMistakeRuleReplayTest(id: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/replay-test`, { method: "POST" });
}

export async function createSkillCandidateFromMistakeRule(id: string): Promise<unknown> {
  return apiFetch(`/rules/${encodeURIComponent(id)}/create-skill-candidate`, { method: "POST" });
}
