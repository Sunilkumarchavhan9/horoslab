export type ExperienceMetric = {
  key: string;
  label: string;
  value: number;
  trendValue: string;
};

export type ExperienceSummary = {
  metrics: ExperienceMetric[];
  totals: {
    outcomes: number;
    experienceRecords: number;
    humanCorrections: number;
    lessons: number;
    futureInstructions: number;
    skillCandidates: number;
  };
};

export type ExperienceTrend = {
  range: string;
  points: Array<{ name: string; value: number; count: number }>;
  learningRate: number;
};

export type CommonLesson = {
  id: string;
  title: string;
  count: number;
};

export type ExperienceTransformation = {
  id: string;
  outcomeId: string;
  rawOutcome: string[];
  futureInstruction: string[];
  confidence: number;
  targetAgent: string;
};

export type ExperienceOutcome = {
  id: string;
  displayId: string;
  workspaceId: string;
  agentRunId: string;
  problem: string;
  context: string;
  action: string;
  mistake: string;
  fix: string;
  outcome: string;
  lesson: string;
  lessonId: string;
  futureInstruction: string;
  time: string;
  humanCorrection: boolean;
  filesChanged: unknown[];
  testsPassed: unknown[];
  testsFailed: unknown[];
  proofAvailable: boolean;
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
  const response = await fetch(`/api/experience${path}`, {
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

export async function getExperienceSummary(): Promise<ExperienceSummary> {
  return apiFetch<ExperienceSummary>("/summary");
}

export async function getExperienceTrend(range = "7d"): Promise<ExperienceTrend> {
  return apiFetch<ExperienceTrend>(`/trend?range=${encodeURIComponent(range)}`);
}

export async function getCommonLessons(): Promise<CommonLesson[]> {
  const payload = await apiFetch<{ lessons: CommonLesson[] }>("/common-lessons");
  return payload.lessons;
}

export async function getExperienceTransformations(): Promise<ExperienceTransformation[]> {
  const payload = await apiFetch<{ transformations: ExperienceTransformation[] }>("/transformations");
  return payload.transformations;
}

export async function listExperienceOutcomes(): Promise<ExperienceOutcome[]> {
  const payload = await apiFetch<{ outcomes: ExperienceOutcome[] }>("/outcomes");
  return payload.outcomes;
}

export async function getExperienceOutcome(id: string): Promise<ExperienceOutcome> {
  const payload = await apiFetch<{ outcome: ExperienceOutcome }>(`/outcomes/${encodeURIComponent(id)}`);
  return payload.outcome;
}

export async function getExperienceOutcomeProof(id: string): Promise<unknown> {
  const payload = await apiFetch<{ proof: unknown }>(`/outcomes/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function createFutureInstructionFromOutcome(id: string): Promise<unknown> {
  return apiFetch(`/outcomes/${encodeURIComponent(id)}/create-future-instruction`, { method: "POST" });
}

export async function createMistakeRuleFromOutcome(id: string): Promise<unknown> {
  return apiFetch(`/outcomes/${encodeURIComponent(id)}/create-mistake-rule`, { method: "POST" });
}

export async function createSkillCandidateFromOutcome(id: string): Promise<unknown> {
  return apiFetch(`/outcomes/${encodeURIComponent(id)}/create-skill-candidate`, { method: "POST" });
}
