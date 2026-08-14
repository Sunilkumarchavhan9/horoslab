import { consoleApiFetch } from "@/lib/console-api";

export type LabKnowledgeFolder = {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  createdAt: string;
};

export type LabKnowledgeItem = {
  id: string;
  name: string;
  content: string;
  trigger: string | null;
  folderId: string | null;
  repo: string | null;
  author: string | null;
  createdAt: string;
  enabled: boolean;
};

export type LabKnowledgeSuggestion = {
  id: string;
  trigger: string;
  content: string;
  user: string | null;
  suggestedOn: string;
  suggestedFolder: string | null;
};

export type LabKnowledgeSettings = {
  adminOnlySuggestions: boolean;
  folders: LabKnowledgeFolder[];
  items: LabKnowledgeItem[];
  suggestions: LabKnowledgeSuggestion[];
};

export type LabKnowledgeSettingsResponse = {
  orgId: string;
  settings: LabKnowledgeSettings;
  updatedAt?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

async function readResponse(res: Response): Promise<LabKnowledgeSettingsResponse | null> {
  if (!res.ok) return null;
  const payload = await res.json();
  const data = unwrapData<LabKnowledgeSettingsResponse>(payload);
  if (!data?.orgId || !data.settings) return null;
  return data;
}

export async function fetchLabKnowledgeSettings(): Promise<LabKnowledgeSettingsResponse | null> {
  try {
    return readResponse(await consoleApiFetch("/api/memory/lab-knowledge-settings"));
  } catch {
    return null;
  }
}

export async function patchLabKnowledgeSettings(input: {
  adminOnlySuggestions?: boolean;
}): Promise<LabKnowledgeSettingsResponse | null> {
  try {
    return readResponse(
      await consoleApiFetch("/api/memory/lab-knowledge-settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  } catch {
    return null;
  }
}

export async function createLabKnowledgeFolder(input: {
  name: string;
  description?: string | null;
}): Promise<LabKnowledgeSettingsResponse | null> {
  try {
    return readResponse(
      await consoleApiFetch("/api/memory/lab-knowledge-settings/folders", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  } catch {
    return null;
  }
}

export async function createLabKnowledgeItem(input: {
  name: string;
  content: string;
  trigger?: string | null;
  folderId?: string | null;
  repo?: string | null;
}): Promise<LabKnowledgeSettingsResponse | null> {
  try {
    return readResponse(
      await consoleApiFetch("/api/memory/lab-knowledge-settings/items", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  } catch {
    return null;
  }
}

export async function patchLabKnowledgeItem(
  itemId: string,
  input: { enabled?: boolean },
): Promise<LabKnowledgeSettingsResponse | null> {
  try {
    return readResponse(
      await consoleApiFetch(`/api/memory/lab-knowledge-settings/items/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );
  } catch {
    return null;
  }
}
