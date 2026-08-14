import { prisma } from "../storage/prismaClient";

export type RuntimePolicySource = "request" | "agent_policy" | "risk_policy" | "workspace_default";

export type MemoryIgnitionRuntimePolicySettings = {
  version: "memoryignition_runtime_policy_settings.v1";
  id: string;
  userId: string;
  orgId: string | null;
  updatedAt: string;
  updatedBy: string | null;
  defaultAllowedTools: string[];
  agentPolicies: Array<{
    agentType: string;
    allowedTools: string[];
  }>;
  riskPolicies: Array<{
    riskLevel: string;
    allowedTools: string[];
    requireApproval: boolean;
  }>;
};

export type RuntimePolicyPatch = Partial<Pick<
  MemoryIgnitionRuntimePolicySettings,
  "defaultAllowedTools" | "agentPolicies" | "riskPolicies"
>>;

const SETTINGS_SECTION = "memoryignition.runtime_policy";

const DEFAULT_ALLOWED_TOOLS = ["read_files", "tests"];

const DEFAULT_RISK_POLICIES = [
  { riskLevel: "low", allowedTools: ["read_files", "tests"], requireApproval: false },
  { riskLevel: "medium", allowedTools: ["read_files", "edit_files", "tests"], requireApproval: false },
  { riskLevel: "high", allowedTools: ["read_files", "tests"], requireApproval: true },
  { riskLevel: "critical", allowedTools: ["read_files"], requireApproval: true },
];

const DEFAULT_AGENT_POLICIES = [
  { agentType: "codex", allowedTools: ["read_files", "edit_files", "tests"] },
  { agentType: "review", allowedTools: ["read_files", "tests"] },
  { agentType: "incident", allowedTools: ["read_files", "terminal", "tests"] },
];

function storeKey(userId: string, orgId?: string | null): string {
  return orgId ? `org:${orgId}` : `user:${userId}`;
}

function scopedOrgId(orgId?: string | null): string {
  return orgId ?? "";
}

function normalizeTool(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized.length > 0 ? normalized : null;
}

function normalizeToolList(values: unknown, fallback: string[]): string[] {
  if (!Array.isArray(values)) return fallback;
  const normalized = values.map(normalizeTool).filter((tool): tool is string => Boolean(tool));
  return Array.from(new Set(normalized));
}

function normalizeAgentPolicies(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_AGENT_POLICIES;
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const agentType = typeof record.agentType === "string" ? record.agentType.trim().toLowerCase() : "";
      if (!agentType) return null;
      return {
        agentType,
        allowedTools: normalizeToolList(record.allowedTools, []),
      };
    })
    .filter((item): item is { agentType: string; allowedTools: string[] } => Boolean(item));
  return normalized.length > 0 ? normalized : DEFAULT_AGENT_POLICIES;
}

function normalizeRiskPolicies(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_RISK_POLICIES;
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const riskLevel = typeof record.riskLevel === "string" ? record.riskLevel.trim().toLowerCase() : "";
      if (!riskLevel) return null;
      return {
        riskLevel,
        allowedTools: normalizeToolList(record.allowedTools, []),
        requireApproval: Boolean(record.requireApproval),
      };
    })
    .filter((item): item is { riskLevel: string; allowedTools: string[]; requireApproval: boolean } => Boolean(item));
  return normalized.length > 0 ? normalized : DEFAULT_RISK_POLICIES;
}

function defaultSettings(userId: string, orgId?: string | null): MemoryIgnitionRuntimePolicySettings {
  const now = new Date().toISOString();
  return {
    version: "memoryignition_runtime_policy_settings.v1",
    id: storeKey(userId, orgId),
    userId,
    orgId: orgId ?? null,
    updatedAt: now,
    updatedBy: null,
    defaultAllowedTools: DEFAULT_ALLOWED_TOOLS,
    agentPolicies: DEFAULT_AGENT_POLICIES,
    riskPolicies: DEFAULT_RISK_POLICIES,
  };
}

function normalizeSettings(
  raw: unknown,
  userId: string,
  orgId?: string | null,
): MemoryIgnitionRuntimePolicySettings {
  const fallback = defaultSettings(userId, orgId);
  if (!raw || typeof raw !== "object") return fallback;
  const record = raw as Record<string, unknown>;
  return {
    ...fallback,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : fallback.updatedAt,
    updatedBy: typeof record.updatedBy === "string" ? record.updatedBy : fallback.updatedBy,
    defaultAllowedTools: normalizeToolList(record.defaultAllowedTools, fallback.defaultAllowedTools),
    agentPolicies: normalizeAgentPolicies(record.agentPolicies),
    riskPolicies: normalizeRiskPolicies(record.riskPolicies),
  };
}

function parseSettingsJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function getMemoryIgnitionRuntimePolicySettings(
  userId: string,
  orgId?: string | null,
): Promise<MemoryIgnitionRuntimePolicySettings> {
  const row = await prisma.scopedSetting.findUnique({
    where: {
      userId_orgId_section: {
        userId,
        orgId: scopedOrgId(orgId),
        section: SETTINGS_SECTION,
      },
    },
  });
  return normalizeSettings(parseSettingsJson(row?.dataJson), userId, orgId);
}

export async function saveMemoryIgnitionRuntimePolicySettings(params: {
  userId: string;
  orgId?: string | null;
  updatedBy?: string | null;
  patch: RuntimePolicyPatch;
}): Promise<MemoryIgnitionRuntimePolicySettings> {
  const current = await getMemoryIgnitionRuntimePolicySettings(params.userId, params.orgId);
  const next = normalizeSettings({
    ...current,
    ...params.patch,
    updatedAt: new Date().toISOString(),
    updatedBy: params.updatedBy ?? params.userId,
  }, params.userId, params.orgId);
  await prisma.scopedSetting.upsert({
    where: {
      userId_orgId_section: {
        userId: params.userId,
        orgId: scopedOrgId(params.orgId),
        section: SETTINGS_SECTION,
      },
    },
    create: {
      userId: params.userId,
      orgId: scopedOrgId(params.orgId),
      section: SETTINGS_SECTION,
      updatedAt: next.updatedAt,
      dataJson: JSON.stringify(next),
    },
    update: {
      updatedAt: next.updatedAt,
      dataJson: JSON.stringify(next),
    },
  });
  return next;
}

export function resolveMemoryIgnitionRuntimeAllowedTools(params: {
  settings: MemoryIgnitionRuntimePolicySettings;
  explicitAllowedTools: string[];
  agentId?: string | null;
  agentType?: string | null;
  riskLevel?: string | null;
}): {
  source: RuntimePolicySource;
  allowedTools: string[];
  policyId: string;
  requiresApproval: boolean;
  approvalPolicyId: string | null;
} {
  const explicitAllowedTools = Array.from(new Set(params.explicitAllowedTools.map(normalizeTool).filter((tool): tool is string => Boolean(tool))));
  const riskLevel = typeof params.riskLevel === "string" ? params.riskLevel.trim().toLowerCase() : "";
  const riskPolicy = params.settings.riskPolicies.find((policy) => policy.riskLevel === riskLevel);
  const requiresApproval = Boolean(riskPolicy?.requireApproval);
  const approvalPolicyId = riskPolicy?.requireApproval ? `risk:${riskPolicy.riskLevel}` : null;

  if (explicitAllowedTools.length > 0) {
    return {
      source: "request",
      allowedTools: explicitAllowedTools,
      policyId: "request.available_tools",
      requiresApproval,
      approvalPolicyId,
    };
  }

  const agent = [params.agentId, params.agentType]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());
  const agentPolicy = params.settings.agentPolicies.find((policy) => agent.includes(policy.agentType));
  if (agentPolicy && agentPolicy.allowedTools.length > 0) {
    return {
      source: "agent_policy",
      allowedTools: agentPolicy.allowedTools,
      policyId: `agent:${agentPolicy.agentType}`,
      requiresApproval,
      approvalPolicyId,
    };
  }

  if (riskPolicy && riskPolicy.allowedTools.length > 0) {
    return {
      source: "risk_policy",
      allowedTools: riskPolicy.allowedTools,
      policyId: `risk:${riskPolicy.riskLevel}`,
      requiresApproval,
      approvalPolicyId,
    };
  }

  return {
    source: "workspace_default",
    allowedTools: params.settings.defaultAllowedTools,
    policyId: "workspace:default",
    requiresApproval,
    approvalPolicyId,
  };
}
