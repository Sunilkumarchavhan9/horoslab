import type { MasterplanAgentRun, MasterplanPackage } from "./masterplan-api";

export type PackageStatus = "ready" | "sent" | "needs_review" | "blocked" | "rebuilt" | string;

export type InheritancePackageRow = MasterplanPackage & {
  status: PackageStatus;
  linkedRun?: (MasterplanAgentRun & { events?: PackageSendHistoryItem[] }) | null;
};

export type PackagesSummary = {
  packagesGenerated: number;
  readyToSend: number;
  sentToday: number;
  needsReview: number;
  blockedPackages: number;
  avgMemoryQuality: number;
  proofLoop: string;
};

export type PackageSendHistoryItem = {
  id: string;
  type: string;
  runId?: string | null;
  targetAgent?: string;
  channel?: string;
  payload?: Record<string, unknown>;
  proof?: Record<string, unknown> | null;
  occurredAt?: string;
  timestamp?: string;
};

export type PackageAuditJson = {
  packageId: string;
  payload: Record<string, unknown>;
  package: InheritancePackageRow;
  status: PackageStatus;
  policyGate: {
    status: string;
    reasons: string[];
    canSend: boolean;
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

export async function getPackagesSummary(): Promise<PackagesSummary> {
  const payload = await apiFetch<{ summary: PackagesSummary }>("/api/packages/summary");
  return payload.summary;
}

export async function listInheritancePackages(status?: string, query?: string): Promise<InheritancePackageRow[]> {
  const payload = await apiFetch<{ packages: InheritancePackageRow[] }>("/api/packages");
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  return payload.packages.filter((item) => {
    if (status && item.status !== status) return false;
    if (!normalizedQuery) return true;
    return `${item.id} ${item.task} ${item.targetAgent} ${item.targetFormat} ${item.autonomyLevel} ${item.status}`
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export async function getPackage(id: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}`);
  return payload.package;
}

export async function getPackageProof(id: string): Promise<Record<string, unknown>> {
  const payload = await apiFetch<{ proof: Record<string, unknown> }>(`/api/packages/${encodeURIComponent(id)}/proof`);
  return payload.proof;
}

export async function getPackagePrompt(id: string): Promise<string> {
  const payload = await apiFetch<{ prompt: string }>(`/api/packages/${encodeURIComponent(id)}/prompt`);
  return payload.prompt;
}

export async function getPackageJson(id: string): Promise<PackageAuditJson> {
  return apiFetch<PackageAuditJson>(`/api/packages/${encodeURIComponent(id)}/json`);
}

export async function getPackageSendHistory(id: string): Promise<PackageSendHistoryItem[]> {
  const payload = await apiFetch<{ history: PackageSendHistoryItem[] }>(`/api/packages/${encodeURIComponent(id)}/send-history`);
  return payload.history;
}

export async function copyPackagePrompt(id: string): Promise<{ prompt: string }> {
  return apiFetch<{ prompt: string }>(`/api/packages/${encodeURIComponent(id)}/copy-prompt`, { method: "POST" });
}

export async function exportPackageJson(id: string): Promise<PackageAuditJson> {
  return apiFetch<PackageAuditJson>(`/api/packages/${encodeURIComponent(id)}/export-json`, { method: "POST" });
}

export async function sendPackageMcp(id: string): Promise<{ run: MasterplanAgentRun; channel: "mcp" }> {
  return apiFetch<{ run: MasterplanAgentRun; channel: "mcp" }>(`/api/packages/${encodeURIComponent(id)}/send-mcp`, { method: "POST" });
}

export async function sendPackageApi(id: string): Promise<{ run: MasterplanAgentRun; channel: "api" }> {
  return apiFetch<{ run: MasterplanAgentRun; channel: "api" }>(`/api/packages/${encodeURIComponent(id)}/send-api`, { method: "POST" });
}

export async function createPackageHandoff(id: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}/create-handoff`, { method: "POST" });
  return payload.package;
}

export async function savePackageTemplate(id: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}/save-template`, { method: "POST" });
  return payload.package;
}

export async function approvePackage(id: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}/approve`, { method: "POST" });
  return payload.package;
}

export async function blockPackage(id: string, reason?: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return payload.package;
}

export async function rebuildPackage(id: string): Promise<InheritancePackageRow> {
  const payload = await apiFetch<{ package: InheritancePackageRow }>(`/api/packages/${encodeURIComponent(id)}/rebuild`, { method: "POST" });
  return payload.package;
}
