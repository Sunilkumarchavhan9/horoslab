export type EpochCompensationAction = { id: string; kind: "rollback" | "compensate"; description: string; privileged: boolean; requiredPermission?: string };
export type EpochRecoveryPlan = { strategy: "retry" | "resume" | "fallback_worker" | "fallback_provider" | "escalate" | "fail"; actions: EpochCompensationAction[]; requiresHuman: boolean; reason: string };

export function buildEpochRecoveryPlan(input: { strategy: EpochRecoveryPlan["strategy"]; reason: string; rollback?: string[]; compensation?: string[]; permissions?: string[] }): EpochRecoveryPlan {
  const permissions = new Set(input.permissions ?? []);
  const actions = [...(input.rollback ?? []).map((description, index) => ({ id: `rollback_${index + 1}`, kind: "rollback" as const, description, privileged: true, requiredPermission: "mission.rollback" })), ...(input.compensation ?? []).map((description, index) => ({ id: `compensate_${index + 1}`, kind: "compensate" as const, description, privileged: true, requiredPermission: "mission.compensate" }))];
  const unauthorized = actions.filter((action) => action.requiredPermission && !permissions.has(action.requiredPermission));
  const firstMissingPermission = unauthorized[0]?.requiredPermission;
  return { strategy: input.strategy, actions: actions.filter((action) => !unauthorized.includes(action)), requiresHuman: input.strategy === "escalate" || unauthorized.length > 0, reason: firstMissingPermission ? `missing_permission:${firstMissingPermission}` : input.reason };
}

export type EpochToolPolicyDecision = { decision: "allow" | "deny" | "review"; reason: string; permission: string; privileged: boolean };

export function decideEpochToolCall(input: { tool: string; permissions: string[]; approvalGranted?: boolean; blockedTools?: string[] }): EpochToolPolicyDecision {
  const permission = `tool.${input.tool}`;
  const privileged = /(^|[.:])(write|delete|execute|shell|deploy|secrets|admin)([.:]|$)/i.test(input.tool);
  if (input.blockedTools?.includes(input.tool)) return { decision: "deny", reason: "tool_blocked_by_policy", permission, privileged };
  if (!input.permissions.includes(permission)) return { decision: "deny", reason: "permission_missing", permission, privileged };
  if (privileged && !input.approvalGranted) return { decision: "review", reason: "privileged_tool_requires_approval", permission, privileged };
  return { decision: "allow", reason: "policy_allowed", permission, privileged };
}
