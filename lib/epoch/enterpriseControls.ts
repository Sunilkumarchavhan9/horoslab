export type EpochEnterpriseRole = "owner" | "admin" | "operator" | "reviewer" | "worker" | "viewer";
export type EpochEnterpriseAction = "mission.create" | "mission.execute" | "mission.verify" | "evidence.read" | "evidence.export" | "worker.manage" | "policy.manage" | "audit.export" | "billing.manage";
const ROLE_ACTIONS: Record<EpochEnterpriseRole, EpochEnterpriseAction[]> = {
  owner: ["mission.create", "mission.execute", "mission.verify", "evidence.read", "evidence.export", "worker.manage", "policy.manage", "audit.export", "billing.manage"],
  admin: ["mission.create", "mission.execute", "mission.verify", "evidence.read", "evidence.export", "worker.manage", "policy.manage", "audit.export"],
  operator: ["mission.create", "mission.execute", "evidence.read"],
  reviewer: ["mission.verify", "evidence.read", "evidence.export"],
  worker: ["mission.execute", "evidence.read"],
  viewer: ["evidence.read"],
};

export function authorizeEpochEnterpriseAction(input: { role: EpochEnterpriseRole; action: EpochEnterpriseAction; subjectWorkspaceId: string; requestWorkspaceId: string; subjectProjectId?: string; requestProjectId?: string }): { allowed: boolean; reason: string } {
  if (input.subjectWorkspaceId !== input.requestWorkspaceId) return { allowed: false, reason: "workspace_scope_mismatch" };
  if (input.subjectProjectId && input.requestProjectId && input.subjectProjectId !== input.requestProjectId) return { allowed: false, reason: "project_scope_mismatch" };
  return ROLE_ACTIONS[input.role].includes(input.action) ? { allowed: true, reason: "role_action_allowed" } : { allowed: false, reason: "role_action_denied" };
}

export function decideEpochRetention(input: { expiresAt: Date | string | null; legalHold: boolean; now?: Date }): { retained: boolean; reason: string } {
  if (input.legalHold) return { retained: true, reason: "legal_hold" };
  if (!input.expiresAt) return { retained: true, reason: "no_expiry" };
  return (input.now ?? new Date()) < new Date(input.expiresAt) ? { retained: true, reason: "within_retention" } : { retained: false, reason: "retention_expired" };
}

export function governEpochBudget(input: { budgetCents: number; spentCents: number; requestedCents: number }): { allowed: boolean; remainingCents: number; reason: string } {
  const remainingCents = Math.max(0, input.budgetCents - input.spentCents);
  if (input.requestedCents < 0) return { allowed: false, remainingCents, reason: "requested_cost_invalid" };
  if (input.requestedCents > remainingCents) return { allowed: false, remainingCents, reason: "budget_would_be_exceeded" };
  return { allowed: true, remainingCents, reason: "within_budget" };
}

export function buildEpochAuditExport(input: { workspaceId: string; records: Array<{ id: string; occurredAt: string; action: string; actorId: string; payload: Record<string, unknown> }> }) {
  return { version: "epoch.audit-export.v1", workspaceId: input.workspaceId, immutable: true, records: input.records.map((record) => ({ ...record, payload: { ...record.payload } })) };
}
