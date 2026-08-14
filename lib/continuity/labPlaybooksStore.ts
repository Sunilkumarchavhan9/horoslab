import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabPlaybookScope = "organization" | "system";
export type LabPlaybookAgentMode = "default" | "normal" | "fast";

export type LabPlaybookRecord = {
  id: string;
  scope: LabPlaybookScope;
  name: string;
  macro: string | null;
  agentMode: LabPlaybookAgentMode;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  readonly: boolean;
};

type OrgPlaybooks = {
  organization: LabPlaybookRecord[];
  system: LabPlaybookRecord[];
};

const SETTINGS_SECTION = "lab-playbooks";

function scopeFromUnknown(value: unknown): LabPlaybookScope {
  return value === "system" ? "system" : "organization";
}

function normalizeMacro(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const macro = value.trim();
  return macro ? macro : null;
}

function normalizeAgentMode(value: unknown): LabPlaybookAgentMode {
  return value === "normal" || value === "fast" ? value : "default";
}

function coerceRecord(raw: unknown, fallbackScope: LabPlaybookScope): LabPlaybookRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<LabPlaybookRecord>;
  const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : randomUUID();
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const content = typeof row.content === "string" ? row.content : "";
  if (!name || !content) return null;
  const now = new Date().toISOString();
  const scope = scopeFromUnknown(row.scope ?? fallbackScope);
  return {
    id,
    scope,
    name,
    macro: normalizeMacro(row.macro),
    agentMode: normalizeAgentMode(row.agentMode),
    content,
    createdBy:
      typeof row.createdBy === "string" && row.createdBy.trim()
        ? row.createdBy.trim()
        : "unknown",
    createdAt: typeof row.createdAt === "string" && row.createdAt.trim() ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === "string" && row.updatedAt.trim() ? row.updatedAt : now,
    readonly: row.readonly === true || scope === "system",
  };
}

function coerceRows(raw: unknown, scope: LabPlaybookScope): LabPlaybookRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = coerceRecord(item, scope);
    return record ? [record] : [];
  });
}

function coerceBucket(raw: unknown): OrgPlaybooks {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Partial<OrgPlaybooks> : {};
  return {
    organization: coerceRows(value.organization, "organization"),
    system: coerceRows(value.system, "system"),
  };
}

async function readOrgBucket(orgId: string): Promise<OrgPlaybooks> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    coerceBucket,
  );
}

async function writeOrgBucket(orgId: string, bucket: OrgPlaybooks): Promise<void> {
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), bucket);
}

function sortRows(rows: LabPlaybookRecord[]): LabPlaybookRecord[] {
  return [...rows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export type LabPlaybooksList = {
  organization: LabPlaybookRecord[];
  system: LabPlaybookRecord[];
};

export async function listLabPlaybooks(orgId: string): Promise<LabPlaybooksList> {
  const bucket = await readOrgBucket(orgId);
  return {
    organization: sortRows(bucket.organization),
    system: sortRows(bucket.system),
  };
}

export async function getLabPlaybook(
  orgId: string,
  playbookId: string,
): Promise<LabPlaybookRecord | null> {
  const bucket = await readOrgBucket(orgId);
  return [...bucket.organization, ...bucket.system].find((row) => row.id === playbookId) ?? null;
}

export type CreateLabPlaybookInput = {
  name: string;
  macro?: string | null;
  agentMode?: LabPlaybookAgentMode | null;
  content: string;
};

export async function createLabPlaybook(
  orgId: string,
  input: CreateLabPlaybookInput,
  createdBy: string,
): Promise<LabPlaybookRecord> {
  const name = input.name.trim();
  const content = input.content;
  if (!name || !content.trim()) throw new Error("invalid_playbook");
  const bucket = await readOrgBucket(orgId);
  const now = new Date().toISOString();
  const record: LabPlaybookRecord = {
    id: randomUUID(),
    scope: "organization",
    name,
    macro: normalizeMacro(input.macro),
    agentMode: normalizeAgentMode(input.agentMode),
    content,
    createdBy,
    createdAt: now,
    updatedAt: now,
    readonly: false,
  };
  bucket.organization.unshift(record);
  await writeOrgBucket(orgId, bucket);
  return record;
}

export type PatchLabPlaybookInput = Partial<CreateLabPlaybookInput>;

export async function patchLabPlaybook(
  orgId: string,
  playbookId: string,
  patch: PatchLabPlaybookInput,
): Promise<LabPlaybookRecord | null> {
  const bucket = await readOrgBucket(orgId);
  const index = bucket.organization.findIndex((row) => row.id === playbookId);
  if (index < 0) return null;
  const existing = bucket.organization[index];
  const nextName = patch.name === undefined ? existing.name : patch.name.trim();
  const nextContent = patch.content === undefined ? existing.content : patch.content;
  if (!nextName || !nextContent.trim()) return null;
  const next: LabPlaybookRecord = {
    ...existing,
    name: nextName,
    macro: patch.macro === undefined ? existing.macro : normalizeMacro(patch.macro),
    agentMode:
      patch.agentMode === undefined ? existing.agentMode : normalizeAgentMode(patch.agentMode),
    content: nextContent,
    updatedAt: new Date().toISOString(),
  };
  bucket.organization[index] = next;
  await writeOrgBucket(orgId, bucket);
  return next;
}

export async function deleteLabPlaybook(orgId: string, playbookId: string): Promise<boolean> {
  const bucket = await readOrgBucket(orgId);
  const before = bucket.organization.length;
  bucket.organization = bucket.organization.filter((row) => row.id !== playbookId);
  if (bucket.organization.length === before) return false;
  await writeOrgBucket(orgId, bucket);
  return true;
}
