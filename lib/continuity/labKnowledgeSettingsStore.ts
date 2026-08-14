import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

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

export type LabKnowledgeSettingsRecord = {
  adminOnlySuggestions: boolean;
  folders: LabKnowledgeFolder[];
  items: LabKnowledgeItem[];
  suggestions: LabKnowledgeSuggestion[];
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-knowledge-settings";

function coerceFolders(raw: unknown): LabKnowledgeFolder[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<LabKnowledgeFolder>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id || !name) return [];
    return [{
      id,
      name,
      description: typeof row.description === "string" ? row.description : null,
      author: typeof row.author === "string" ? row.author : null,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
    }];
  });
}

function coerceItems(raw: unknown): LabKnowledgeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<LabKnowledgeItem>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const content = typeof row.content === "string" ? row.content : "";
    if (!id || !name || !content) return [];
    return [{
      id,
      name,
      content,
      trigger: typeof row.trigger === "string" ? row.trigger : null,
      folderId: typeof row.folderId === "string" ? row.folderId : null,
      repo: typeof row.repo === "string" ? row.repo : null,
      author: typeof row.author === "string" ? row.author : null,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
      enabled: row.enabled !== false,
    }];
  });
}

function coerceSuggestions(raw: unknown): LabKnowledgeSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<LabKnowledgeSuggestion>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const trigger = typeof row.trigger === "string" ? row.trigger : "";
    const content = typeof row.content === "string" ? row.content : "";
    if (!id || !trigger || !content) return [];
    return [{
      id,
      trigger,
      content,
      user: typeof row.user === "string" ? row.user : null,
      suggestedOn: typeof row.suggestedOn === "string" ? row.suggestedOn : new Date().toISOString(),
      suggestedFolder: typeof row.suggestedFolder === "string" ? row.suggestedFolder : null,
    }];
  });
}

function normalize(raw: Partial<LabKnowledgeSettingsRecord> | null | undefined): LabKnowledgeSettingsRecord {
  return {
    adminOnlySuggestions: raw?.adminOnlySuggestions === true,
    folders: coerceFolders(raw?.folders),
    items: coerceItems(raw?.items),
    suggestions: coerceSuggestions(raw?.suggestions),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

async function writeOrg(
  orgId: string,
  partial: Partial<LabKnowledgeSettingsRecord>,
): Promise<LabKnowledgeSettingsRecord> {
  const current = await getLabKnowledgeSettings(orgId);
  const updatedAt = new Date().toISOString();
  const next = normalize({ ...current, ...partial, updatedAt });
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}

export async function getLabKnowledgeSettings(orgId: string): Promise<LabKnowledgeSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => normalize(raw as Partial<LabKnowledgeSettingsRecord> | null | undefined),
  );
}

export async function patchLabKnowledgeSettings(
  orgId: string,
  patch: Pick<Partial<LabKnowledgeSettingsRecord>, "adminOnlySuggestions">,
): Promise<LabKnowledgeSettingsRecord> {
  return writeOrg(orgId, { adminOnlySuggestions: patch.adminOnlySuggestions === true });
}

export async function createLabKnowledgeFolder(
  orgId: string,
  input: { name: string; description?: string | null; author?: string | null },
): Promise<LabKnowledgeSettingsRecord> {
  const current = await getLabKnowledgeSettings(orgId);
  const folder: LabKnowledgeFolder = {
    id: randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    author: input.author ?? null,
    createdAt: new Date().toISOString(),
  };
  return writeOrg(orgId, { folders: [folder, ...current.folders] });
}

export async function createLabKnowledgeItem(
  orgId: string,
  input: {
    name: string;
    content: string;
    trigger?: string | null;
    folderId?: string | null;
    repo?: string | null;
    author?: string | null;
  },
): Promise<LabKnowledgeSettingsRecord> {
  const current = await getLabKnowledgeSettings(orgId);
  const item: LabKnowledgeItem = {
    id: randomUUID(),
    name: input.name.trim(),
    content: input.content,
    trigger: input.trigger?.trim() || null,
    folderId: input.folderId ?? null,
    repo: input.repo ?? null,
    author: input.author ?? null,
    createdAt: new Date().toISOString(),
    enabled: true,
  };
  return writeOrg(orgId, { items: [item, ...current.items] });
}

export async function patchLabKnowledgeItem(
  orgId: string,
  itemId: string,
  patch: { enabled?: boolean },
): Promise<LabKnowledgeSettingsRecord> {
  const current = await getLabKnowledgeSettings(orgId);
  return writeOrg(orgId, {
    items: current.items.map((item) =>
      item.id === itemId ? { ...item, enabled: patch.enabled ?? item.enabled } : item,
    ),
  });
}
