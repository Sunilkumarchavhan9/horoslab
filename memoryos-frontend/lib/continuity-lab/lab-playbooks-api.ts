import { consoleApiFetch } from "@/lib/console-api";

export type LabPlaybookScope = "organization" | "system";
export type LabPlaybookAgentMode = "default" | "normal" | "fast";

export type LabPlaybook = {
  id: string;
  scope: LabPlaybookScope;
  name: string;
  macro: string | null;
  agentMode?: LabPlaybookAgentMode;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  readonly: boolean;
};

export type LabPlaybooksListResponse = {
  orgId: string;
  playbooks: {
    organization: LabPlaybook[];
    system: LabPlaybook[];
  };
};

export type LabPlaybookResponse = {
  orgId: string;
  playbook: LabPlaybook;
};

export type LabPlaybookDraft = {
  name: string;
  macro?: string | null;
  agentMode?: LabPlaybookAgentMode | null;
  content: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function isListResponse(data: LabPlaybooksListResponse | null): data is LabPlaybooksListResponse {
  return Boolean(
    data?.orgId &&
      data.playbooks &&
      Array.isArray(data.playbooks.organization) &&
      Array.isArray(data.playbooks.system),
  );
}

export async function fetchLabPlaybooks(): Promise<LabPlaybooksListResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-playbooks");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabPlaybooksListResponse>(payload);
    return isListResponse(data) ? data : null;
  } catch {
    return null;
  }
}

export async function fetchLabPlaybook(playbookId: string): Promise<LabPlaybookResponse | null> {
  try {
    const res = await consoleApiFetch(`/api/memory/lab-playbooks/${encodeURIComponent(playbookId)}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabPlaybookResponse>(payload);
    return data?.orgId && data.playbook ? data : null;
  } catch {
    return null;
  }
}

export async function createLabPlaybook(draft: LabPlaybookDraft): Promise<LabPlaybook | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-playbooks", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabPlaybookResponse>(payload);
    return data?.playbook ?? null;
  } catch {
    return null;
  }
}

export async function patchLabPlaybook(
  playbookId: string,
  draft: Partial<LabPlaybookDraft>,
): Promise<LabPlaybook | null> {
  try {
    const res = await consoleApiFetch(`/api/memory/lab-playbooks/${encodeURIComponent(playbookId)}`, {
      method: "PATCH",
      body: JSON.stringify(draft),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<LabPlaybookResponse>(payload);
    return data?.playbook ?? null;
  } catch {
    return null;
  }
}

export async function deleteLabPlaybook(playbookId: string): Promise<boolean> {
  try {
    const res = await consoleApiFetch(`/api/memory/lab-playbooks/${encodeURIComponent(playbookId)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
