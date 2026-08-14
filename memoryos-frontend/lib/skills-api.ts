export type SkillSummaryCard = {
  key: string;
  label: string;
  value: string | number;
  delta: string;
};

export type SkillsSummary = {
  cards: SkillSummaryCard[];
  totals: {
    total: number;
    approved: number;
    candidates: number;
    installed: number;
    conflicts: number;
    deprecated: number;
    averageQuality: number;
  };
  proofLoop: string;
};

export type AgentSkillRow = {
  id: string;
  name: string;
  desc: string;
  description: string;
  domain: string;
  quality: string;
  qualityScore: number;
  successRate: number;
  status: string;
  version: string;
  installed: boolean;
  installedCount: number;
  qualityReportCount: number;
  referenceCount: number;
  routerRuleCount: number;
  updated: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  trigger: unknown;
  requiredMemories: string[];
  requiredTools: string[];
  requiredTests: string[];
  approvalRules: string[];
  proof: unknown;
  sourceType: string;
  sourceRef: string | null;
  installations?: unknown[];
  qualityReports?: unknown[];
  references?: unknown[];
  routerRules?: unknown[];
  conflicts?: unknown[];
  installation?: unknown;
};

export type QualityFrameworkItem = {
  dim: string;
  desc: string;
  key: string;
  score: string;
  rawScore: number;
};

export type QualityFramework = {
  dimensions: QualityFrameworkItem[];
  overallScore: string;
  overallRawScore: number;
  label: string;
};

export type SkillConflict = {
  id: string;
  type: string;
  severity: string;
  status: string;
  reason: string;
  primarySkill?: AgentSkillRow;
  conflictingSkill?: AgentSkillRow | null;
  createdAt: string;
};

export type SkillRouterRule = {
  id: string;
  name: string;
  trigger: unknown;
  priority: number;
  status: string;
  skill?: AgentSkillRow;
  createdAt: string;
};

type SkillFilters = {
  tab?: string;
  domain?: string;
  status?: string;
  search?: string;
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `skills_api_${response.status}`);
  }
  return response.json() as Promise<T>;
}

function qs(filters: SkillFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function getSkillsSummary(): Promise<SkillsSummary> {
  return apiJson<SkillsSummary>("/api/skills/summary");
}

export async function listSkills(filters: SkillFilters = {}): Promise<AgentSkillRow[]> {
  const body = await apiJson<{ skills: AgentSkillRow[] }>(`/api/skills${qs(filters)}`);
  return body.skills;
}

export async function getSkill(id: string): Promise<AgentSkillRow> {
  const body = await apiJson<{ skill: AgentSkillRow }>(`/api/skills/${encodeURIComponent(id)}`);
  return body.skill;
}

export async function getSkillProof(id: string): Promise<Record<string, unknown>> {
  const body = await apiJson<{ proof: Record<string, unknown> }>(`/api/skills/${encodeURIComponent(id)}/proof`);
  return body.proof;
}

export async function getSkillReferences(id: string): Promise<unknown[]> {
  const body = await apiJson<{ references: unknown[] }>(`/api/skills/${encodeURIComponent(id)}/references`);
  return body.references;
}

export async function getSkillQualityReport(id: string): Promise<{ latest: unknown | null; reports: unknown[] }> {
  return apiJson<{ latest: unknown | null; reports: unknown[] }>(`/api/skills/${encodeURIComponent(id)}/quality-report`);
}

export async function getQualityFramework(): Promise<QualityFramework> {
  return apiJson<QualityFramework>("/api/skills/quality-framework");
}

export async function getSkillHellRisk(): Promise<Record<string, unknown>> {
  return apiJson<Record<string, unknown>>("/api/skills/skill-hell-risk");
}

export async function getSkillConflicts(): Promise<SkillConflict[]> {
  const body = await apiJson<{ conflicts: SkillConflict[] }>("/api/skills/conflicts");
  return body.conflicts;
}

export async function getSkillRouter(): Promise<SkillRouterRule[]> {
  const body = await apiJson<{ rules: SkillRouterRule[] }>("/api/skills/router");
  return body.rules;
}

export async function createSkill(payload: Partial<AgentSkillRow> & { name: string }): Promise<AgentSkillRow> {
  const body = await apiJson<{ skill: AgentSkillRow }>("/api/skills", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.skill;
}

export async function approveSkill(id: string): Promise<AgentSkillRow> {
  const body = await apiJson<{ skill: AgentSkillRow }>(`/api/skills/${encodeURIComponent(id)}/approve`, { method: "POST" });
  return body.skill;
}

export async function deprecateSkill(id: string): Promise<AgentSkillRow> {
  const body = await apiJson<{ skill: AgentSkillRow }>(`/api/skills/${encodeURIComponent(id)}/deprecate`, { method: "POST" });
  return body.skill;
}

export async function installSkill(id: string, repoPath?: string): Promise<{ installation: unknown; installPath: string }> {
  return apiJson<{ installation: unknown; installPath: string }>(`/api/skills/${encodeURIComponent(id)}/install`, {
    method: "POST",
    body: JSON.stringify({ repoPath }),
  });
}

export async function syncSkillToRepo(id: string, repoPath?: string): Promise<{ installPath: string; synced: boolean }> {
  return apiJson<{ installPath: string; synced: boolean }>(`/api/skills/${encodeURIComponent(id)}/sync-to-repo`, {
    method: "POST",
    body: JSON.stringify({ repoPath }),
  });
}

export async function runSkillQualityCheck(id: string): Promise<{ report: unknown }> {
  return apiJson<{ report: unknown }>(`/api/skills/${encodeURIComponent(id)}/run-quality-check`, { method: "POST" });
}

export async function createSkillRouterRule(id: string): Promise<{ rule: unknown }> {
  return apiJson<{ rule: unknown }>(`/api/skills/${encodeURIComponent(id)}/create-router-rule`, { method: "POST" });
}

export async function mergeSkill(id: string, targetSkillId?: string): Promise<unknown> {
  return apiJson<unknown>(`/api/skills/${encodeURIComponent(id)}/merge`, {
    method: "POST",
    body: JSON.stringify({ targetSkillId }),
  });
}

export async function pruneSkill(id: string): Promise<unknown> {
  return apiJson<unknown>(`/api/skills/${encodeURIComponent(id)}/prune`, { method: "POST" });
}

export async function installSkillById(skillId: string, repoPath?: string): Promise<{ installation: unknown; installPath: string }> {
  return apiJson<{ installation: unknown; installPath: string }>("/api/skills/install", {
    method: "POST",
    body: JSON.stringify({ skillId, repoPath }),
  });
}

export async function runAllSkillQualityChecks(): Promise<{ reports: unknown[] }> {
  return apiJson<{ reports: unknown[] }>("/api/skills/quality-check", { method: "POST" });
}

export async function generateSkillRepoFiles(repoPath?: string): Promise<{ files: string[] }> {
  return apiJson<{ files: string[] }>("/api/skills/generate-repo-files", {
    method: "POST",
    body: JSON.stringify({ repoPath }),
  });
}
