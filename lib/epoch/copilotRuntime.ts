export const EPOCH_COPILOT_KINDS = ["mission", "operations", "policy", "analytics"] as const;
export type EpochCopilotKind = (typeof EPOCH_COPILOT_KINDS)[number];
export type EpochCopilotDraft = {
  id: string;
  workspaceId: string;
  kind: EpochCopilotKind;
  authorId: string;
  missionId?: string;
  content: Record<string, unknown>;
  risk: "low" | "medium" | "high";
  status: "draft" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

export function createEpochCopilotDraft(input: { id: string; workspaceId: string; kind: EpochCopilotKind; authorId: string; missionId?: string; content: Record<string, unknown>; risk?: EpochCopilotDraft["risk"]; now?: Date }): EpochCopilotDraft {
  if (!input.id || !input.workspaceId || !input.authorId) throw new Error("epoch_copilot_scope_required");
  return { id: input.id, workspaceId: input.workspaceId, kind: input.kind, authorId: input.authorId, missionId: input.missionId, content: structuredClone(input.content), risk: input.risk ?? "medium", status: "draft", createdAt: (input.now ?? new Date()).toISOString() };
}

export function approveEpochCopilotDraft(input: { draft: EpochCopilotDraft; approverId: string; workspaceId: string; now?: Date }): EpochCopilotDraft {
  if (input.draft.workspaceId !== input.workspaceId) throw new Error("epoch_copilot_workspace_mismatch");
  if (input.draft.authorId === input.approverId) throw new Error("epoch_copilot_separation_of_duties_required");
  if (input.draft.status !== "draft") throw new Error("epoch_copilot_draft_not_pending");
  return { ...input.draft, status: "approved", approvedBy: input.approverId, approvedAt: (input.now ?? new Date()).toISOString() };
}

export function rejectEpochCopilotDraft(input: { draft: EpochCopilotDraft; reviewerId: string; workspaceId: string }): EpochCopilotDraft {
  if (input.draft.workspaceId !== input.workspaceId) throw new Error("epoch_copilot_workspace_mismatch");
  if (input.draft.status !== "draft") throw new Error("epoch_copilot_draft_not_pending");
  return { ...input.draft, status: "rejected", approvedBy: input.reviewerId };
}

export function assertEpochCopilotMayApply(draft: EpochCopilotDraft): void {
  if (draft.status !== "approved" || !draft.approvedBy) throw new Error("epoch_copilot_approval_required");
}
