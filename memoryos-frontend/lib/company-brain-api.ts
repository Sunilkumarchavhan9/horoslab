export type CompanyBrainSummary = {
  totalMemories: number;
  approved: number;
  needsReview: number;
  stale: number;
  highRisk: number;
  linkedOutcomes: number;
  avgQuality: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  proofLoop: string;
};

export type CompanyMemory = {
  id: string;
  workspaceId: string;
  sourceItemId?: string | null;
  type: string;
  title: string;
  summary: string;
  content: string;
  proof: Record<string, unknown>;
  confidenceScore: number;
  freshnessScore: number;
  qualityScore: number;
  riskLevel: string;
  relatedFiles: string[];
  relatedTests: string[];
  status: string;
  createdAt: string;
  relatedScore?: number;
};

export type MemoryProof = {
  memoryId: string;
  sourceItemId?: string | null;
  proof: Record<string, unknown>;
  integrityChecks: Array<{ label: string; status: string }>;
  loop: string;
};

type ListMemoryInput = {
  type?: string;
  status?: string;
  riskLevel?: string;
  query?: string;
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

function queryString(input: ListMemoryInput): string {
  const params = new URLSearchParams();
  if (input.type && input.type !== "All") params.set("type", input.type);
  if (input.status) params.set("status", input.status);
  if (input.riskLevel) params.set("riskLevel", input.riskLevel);
  if (input.query) params.set("q", input.query);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function getCompanyBrainSummary(): Promise<CompanyBrainSummary> {
  const payload = await apiFetch<{ summary: CompanyBrainSummary }>("/api/company-brain/summary");
  return payload.summary;
}

export async function listMemories(input: ListMemoryInput = {}): Promise<CompanyMemory[]> {
  const payload = await apiFetch<{ memories: CompanyMemory[] }>(`/api/memories${queryString(input)}`);
  return payload.memories;
}

export async function searchMemories(query: string): Promise<CompanyMemory[]> {
  const payload = await apiFetch<{ memories: CompanyMemory[] }>("/api/memories/search", {
    method: "POST",
    body: JSON.stringify({ query, limit: 100 }),
  });
  return payload.memories;
}

export async function getMemory(id: string): Promise<CompanyMemory> {
  const payload = await apiFetch<{ memory: CompanyMemory }>(`/api/memories/${encodeURIComponent(id)}`);
  return payload.memory;
}

export async function patchMemory(id: string, body: Partial<CompanyMemory>): Promise<CompanyMemory> {
  const payload = await apiFetch<{ memory: CompanyMemory }>(`/api/memories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return payload.memory;
}

export async function approveMemory(id: string): Promise<CompanyMemory> {
  return memoryAction(id, "approve");
}

export async function deprecateMemory(id: string): Promise<CompanyMemory> {
  return memoryAction(id, "deprecate");
}

export async function markMemoryStale(id: string): Promise<CompanyMemory> {
  return memoryAction(id, "mark-stale");
}

export async function verifyMemory(id: string): Promise<CompanyMemory> {
  return memoryAction(id, "verify");
}

export async function addMemoryCorrection(id: string, correction: string): Promise<CompanyMemory> {
  const payload = await apiFetch<{ memory: CompanyMemory }>(`/api/memories/${encodeURIComponent(id)}/add-correction`, {
    method: "POST",
    body: JSON.stringify({ correction }),
  });
  return payload.memory;
}

export async function mergeMemory(id: string, targetMemoryId: string): Promise<CompanyMemory> {
  const payload = await apiFetch<{ memory: CompanyMemory }>(`/api/memories/${encodeURIComponent(id)}/merge`, {
    method: "POST",
    body: JSON.stringify({ targetMemoryId }),
  });
  return payload.memory;
}

export async function createFutureInstruction(id: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/api/memories/${encodeURIComponent(id)}/create-future-instruction`, {
    method: "POST",
  });
}

export async function createMistakeRule(id: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/api/memories/${encodeURIComponent(id)}/create-mistake-rule`, {
    method: "POST",
  });
}

export async function getMemoryProof(id: string): Promise<MemoryProof> {
  const payload = await apiFetch<{ proof: MemoryProof }>(`/api/memories/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function getRelatedMemories(id: string): Promise<CompanyMemory[]> {
  const payload = await apiFetch<{ memories: CompanyMemory[] }>(`/api/memories/${encodeURIComponent(id)}/related`);
  return payload.memories;
}

async function memoryAction(id: string, action: string): Promise<CompanyMemory> {
  const payload = await apiFetch<{ memory: CompanyMemory }>(`/api/memories/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
  });
  return payload.memory;
}
