import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabSkillsRulesSettingsChanged } from "@/lib/continuity-lab/lab-skills-rules-settings-events";
import {
  readLabSkillsRulesSettings,
  saveLabSkillsRulesSettings,
  type LabSkillsRulesSettings,
  type SkillsRulesCompileResult,
  type SkillsRulesRepoCompileStats,
} from "@/lib/continuity-lab/lab-skills-rules-settings-storage";

export type DiscoveredSkillsRulesItem = {
  name: string;
  path: string;
  type: "skill" | "rule";
};

export type RepoSkillsRulesSummary = {
  repo: string;
  ref?: string;
  items: DiscoveredSkillsRulesItem[];
  skillCount: number;
  ruleCount: number;
  totalCount: number;
  discoveredAt: string | null;
  stale?: boolean;
  error?: string;
};

export type { SkillsRulesCompileResult, SkillsRulesRepoCompileStats };

export type LabSkillsRulesSettingsResponse = {
  orgId: string;
  settings: LabSkillsRulesSettings;
  repos?: RepoSkillsRulesSummary[];
  githubConnected?: boolean;
  updatedAt?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(record: LabSkillsRulesSettings & { updatedAt?: string }): LabSkillsRulesSettings {
  const { updatedAt: _updatedAt, ...settings } = record;
  return settings;
}

function applyRemoteSettings(
  response: LabSkillsRulesSettingsResponse,
): LabSkillsRulesSettingsResponse {
  saveLabSkillsRulesSettings(response.settings, { broadcast: false });
  broadcastLabSkillsRulesSettingsChanged({
    settings: response.settings,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
    repos: response.repos,
    githubConnected: response.githubConnected,
  });
  return response;
}

export async function fetchLabSkillsRulesSettingsFromApi(): Promise<LabSkillsRulesSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-skills-rules-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabSkillsRulesSettings;
      repos?: RepoSkillsRulesSummary[];
      githubConnected?: boolean;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabSkillsRulesSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      repos: data.repos,
      githubConnected: data.githubConnected,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function patchLabSkillsRulesSettingsToApi(
  partial: Partial<LabSkillsRulesSettings>,
): Promise<LabSkillsRulesSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-skills-rules-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabSkillsRulesSettings;
      repos?: RepoSkillsRulesSummary[];
      githubConnected?: boolean;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabSkillsRulesSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      repos: data.repos,
      githubConnected: data.githubConnected,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function discoverSkillsRulesForRepo(
  repo: string,
): Promise<RepoSkillsRulesSummary | null> {
  try {
    const res = await consoleApiFetch(
      `/api/memory/lab-skills-rules/discover?repo=${encodeURIComponent(repo)}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ repo?: RepoSkillsRulesSummary }>(payload);
    return data?.repo ?? null;
  } catch {
    return null;
  }
}

export async function refreshAllSkillsRulesDiscovery(): Promise<RepoSkillsRulesSummary[] | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-skills-rules/refresh", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ repos?: RepoSkillsRulesSummary[] }>(payload);
    return data?.repos ?? null;
  } catch {
    return null;
  }
}

export async function fetchSkillsRulesFileContent(input: {
  repo: string;
  path: string;
  ref?: string;
}): Promise<{ content: string; ref: string; sha: string | null } | null> {
  try {
    const params = new URLSearchParams({ repo: input.repo, path: input.path });
    if (input.ref?.trim()) params.set("ref", input.ref.trim());
    const res = await consoleApiFetch(`/api/memory/lab-skills-rules/content?${params}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ content?: string; ref?: string; sha?: string | null }>(payload);
    if (typeof data?.content !== "string") return null;
    return {
      content: data.content,
      ref: data.ref ?? "",
      sha: typeof data.sha === "string" ? data.sha : data.sha === null ? null : null,
    };
  } catch {
    return null;
  }
}

export async function saveSkillsRulesFileContent(input: {
  repo: string;
  path: string;
  content: string;
  sha?: string | null;
  ref?: string;
  message?: string;
}): Promise<{ content: string; ref: string; sha: string | null; commitUrl: string | null } | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-skills-rules/content", {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      content?: string;
      ref?: string;
      sha?: string | null;
      commitUrl?: string | null;
    }>(payload);
    if (typeof data?.content !== "string") return null;
    return {
      content: data.content,
      ref: data.ref ?? "",
      sha: typeof data.sha === "string" ? data.sha : null,
      commitUrl: data.commitUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function compileSkillsRules(input?: {
  repo?: string;
  force?: boolean;
}): Promise<SkillsRulesCompileResult | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-skills-rules/compile", {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    return unwrapData<SkillsRulesCompileResult>(payload);
  } catch {
    return null;
  }
}

export async function fetchSkillsRulesContext(
  repo?: string | null,
): Promise<string | null> {
  try {
    const params = repo?.trim() ? `?repo=${encodeURIComponent(repo.trim())}` : "";
    const res = await consoleApiFetch(`/api/memory/lab-skills-rules/context${params}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ context?: string | null }>(payload);
    return typeof data?.context === "string" ? data.context : null;
  } catch {
    return null;
  }
}

export async function loadLabSkillsRulesSettingsHybrid(): Promise<LabSkillsRulesSettingsResponse | null> {
  const remote = await fetchLabSkillsRulesSettingsFromApi();
  if (remote) return remote;
  return null;
}

export function loadLabSkillsRulesSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabSkillsRulesSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabSkillsRulesSettings(),
  };
}
