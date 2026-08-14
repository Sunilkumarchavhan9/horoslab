/**
 * Company Brain execution proposals from Continuity Lab (governed write-back).
 */

import {
  fetchCompanyBrainFunnel,
  patchServerFunnelProgress,
} from "@/lib/company-brain-funnel";
import { consoleApiFetch, consoleAuthHeaders } from "@/lib/console-api";
import {
  saveMemoryOSLaunchContext,
  saveResumeProject,
  type MemoryOSLaunchContext,
} from "@/lib/continuity-launch-context";
import {
  MEMORYOS_AGENT_ID_HEADER,
  MEMORYOS_AGENT_SESSION_HEADER,
} from "@/lib/memoryos-agent-headers";

export type ExecutionProposalSummary = {
  id: string;
  adapter: string;
  actionType: string;
  riskTier: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
  createdAt: string;
  secondFactorVerified?: boolean;
  error?: string | null;
  payload?: Record<string, unknown>;
};

export type LabExecutionActionKind = "issue_comment" | "noop";

export type ProposeLabExecutionInput = {
  actionKind: LabExecutionActionKind;
  goal: string;
  riskTier: "low" | "medium" | "high";
  projectId: string;
  sessionId?: string;
  repoFullName?: string | null;
  issueNumber?: number;
  commentBody?: string;
};

export function parseRepoFullName(
  fullName: string | null | undefined,
): { owner: string; repo: string } | null {
  if (!fullName?.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

export async function fetchPendingExecutionProposals(): Promise<ExecutionProposalSummary[]> {
  const res = await consoleApiFetch("/api/company-brain/execution/proposals?pending=true");
  const payload = (await res.json().catch(() => null)) as {
    proposals?: ExecutionProposalSummary[];
    error?: string;
  } | null;
  if (!res.ok) {
    throw new Error(payload?.error ?? "Could not load execution proposals.");
  }
  return Array.isArray(payload?.proposals) ? payload.proposals : [];
}

function agentHeaders(sessionId?: string): HeadersInit {
  const headers: Record<string, string> = {
    [MEMORYOS_AGENT_ID_HEADER]: "continuity-lab",
  };
  if (sessionId?.trim()) {
    headers[MEMORYOS_AGENT_SESSION_HEADER] = sessionId.trim();
  }
  return headers;
}

export async function proposeLabExecution(
  input: ProposeLabExecutionInput,
): Promise<ExecutionProposalSummary> {
  const goal = input.goal.trim();
  if (!goal) throw new Error("Goal is required.");

  const useGitHub =
    input.actionKind === "issue_comment" && Boolean(input.repoFullName?.trim());
  const parsed = parseRepoFullName(input.repoFullName);
  const adapter = useGitHub && parsed ? "github" : "generic";
  const actionType = useGitHub && parsed ? "issue_comment" : "noop";

  let payload: Record<string, unknown> = {};
  if (adapter === "github" && parsed) {
    const body =
      input.commentBody?.trim() ||
      `Continuity Lab governed write-back:\n\n${goal}`;
    const issueNumber = input.issueNumber;
    if (!issueNumber || issueNumber < 1) {
      throw new Error("PR or issue number is required for GitHub comments.");
    }
    payload = {
      owner: parsed.owner,
      repo: parsed.repo,
      body,
      issueNumber,
    };
  }

  const headers = await consoleAuthHeaders(agentHeaders(input.sessionId));
  const res = await fetch("/api/company-brain/execution/propose", {
    method: "POST",
    headers,
    body: JSON.stringify({
      adapter,
      actionType,
      payload,
      riskTier: input.riskTier,
      goal,
      projectId: input.projectId,
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as {
    proposal?: ExecutionProposalSummary;
    error?: string;
  } | null;
  if (!res.ok || !data?.proposal) {
    throw new Error(data?.error ?? "Could not create execution proposal.");
  }
  return data.proposal;
}

export async function reviewLabExecutionProposal(
  proposalId: string,
  decision: "approve" | "reject",
  secondFactorVerified = false,
): Promise<ExecutionProposalSummary> {
  const res = await consoleApiFetch("/api/company-brain/execution/review", {
    method: "POST",
    body: JSON.stringify({ proposalId, decision, secondFactorVerified }),
  });
  const data = (await res.json().catch(() => null)) as {
    proposal?: ExecutionProposalSummary;
    error?: string;
  } | null;
  if (!res.ok || !data?.proposal) {
    throw new Error(data?.error ?? "Could not review execution proposal.");
  }
  return data.proposal;
}

export async function executeLabProposal(
  proposalId: string,
): Promise<ExecutionProposalSummary> {
  const res = await consoleApiFetch("/api/company-brain/execution/execute", {
    method: "POST",
    body: JSON.stringify({ proposalId }),
  });
  const data = (await res.json().catch(() => null)) as {
    proposal?: ExecutionProposalSummary;
    error?: string;
  } | null;
  if (!res.ok || !data?.proposal) {
    throw new Error(data?.error ?? "Could not execute proposal.");
  }
  return data.proposal;
}

export async function markLabExecutionFunnelComplete(input: {
  project: string;
  launchContext?: MemoryOSLaunchContext | null;
}): Promise<string | null> {
  const headers = await consoleAuthHeaders();
  await patchServerFunnelProgress({ executed: true }, headers);
  const funnel = await fetchCompanyBrainFunnel(headers);
  const project =
    funnel?.continuityLoop?.lastProject?.trim() ||
    funnel?.progress?.lastProject?.trim() ||
    input.project.trim();
  if (project) {
    saveResumeProject(project);
    if (input.launchContext) {
      saveMemoryOSLaunchContext({
        ...input.launchContext,
        project,
      });
    }
  }
  return project || null;
}
