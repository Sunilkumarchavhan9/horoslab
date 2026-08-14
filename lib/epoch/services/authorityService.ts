import {
  createEpochAuthorityPolicy,
  getEpochAuthorityGate,
  getEpochAuthorityPolicy,
  listEpochAuthorityPolicies,
} from "../epochStore";

export async function summarizeAuthorityService(workspaceId: string) {
  const policies = await listEpochAuthorityPolicies({ workspaceId });
  return {
    workspaceId,
    counts: {
      policies: policies.length,
      blocked: policies.filter((policy) => policy.blocked).length,
      needsApproval: policies.filter((policy) => policy.needsApproval).length,
      canExecute: policies.filter((policy) => policy.canExecute).length,
    },
    recent: policies.slice(0, 10),
  };
}

export async function createAuthorityPolicy(input: Parameters<typeof createEpochAuthorityPolicy>[0]) {
  return createEpochAuthorityPolicy(input);
}

export async function getAuthorityPolicy(workspaceId: string, policyId: string) {
  return getEpochAuthorityPolicy(workspaceId, policyId);
}

export async function getAuthorityGate(workspaceId: string, missionId: string) {
  return getEpochAuthorityGate(workspaceId, missionId);
}
