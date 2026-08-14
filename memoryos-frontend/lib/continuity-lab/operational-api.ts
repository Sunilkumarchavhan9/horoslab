/**
 * Continuity operational APIs for workflow cards (execution/decision history).
 */

import { consoleApiFetch } from "@/lib/console-api";

export type DecisionHistoryEntry = {
  memoryId: string;
  summary: string;
  content: string;
  contractCategory: string;
  updatedAt: string;
  confidence: number;
  sourceRef?: string | null;
  files?: string[];
};

export type ActionMemoryRecord = {
  id: string;
  action: string;
  reason: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  filesChanged: string[];
  outcome: "success" | "failed" | "rolled_back";
  sourceType?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type ExecutionOutcomeRecord = {
  id: string;
  status: string;
  goal?: string | null;
  resultSummary?: string | null;
  errorMessage?: string | null;
  connectorAdapter?: string | null;
  externalRef?: string | null;
  createdAt: string;
};

export type ApprovalTraceRecord = {
  id: string;
  approverId: string;
  decision: "approved" | "rejected";
  reason?: string | null;
  riskTier?: string | null;
  proposalId?: string | null;
  createdAt: string;
};

export type ExecutionLineageItem = {
  actionMemory: ActionMemoryRecord;
  executionOutcome?: ExecutionOutcomeRecord;
  approvalTraces: ApprovalTraceRecord[];
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

export async function fetchDecisionHistory(
  projectId: string,
  limit = 20,
): Promise<DecisionHistoryEntry[]> {
  const project = projectId.trim();
  if (!project) return [];
  try {
    const res = await consoleApiFetch(
      `/api/memory/decision-history?projectId=${encodeURIComponent(project)}&limit=${limit}`,
    );
    if (!res.ok) return [];
    const payload = await res.json();
    const data = unwrapData<{ decisions?: DecisionHistoryEntry[] }>(payload);
    return Array.isArray(data?.decisions) ? data.decisions : [];
  } catch {
    return [];
  }
}

export async function fetchExecutionHistory(
  projectId: string,
  limit = 10,
): Promise<ExecutionLineageItem[]> {
  const project = projectId.trim();
  if (!project) return [];
  try {
    const res = await consoleApiFetch(
      `/api/memory/execution-history?projectId=${encodeURIComponent(project)}&limit=${limit}`,
    );
    if (!res.ok) return [];
    const payload = await res.json();
    const data = unwrapData<{ items?: ExecutionLineageItem[] }>(payload);
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

const INCIDENT_PATTERN = /incident|outage|sev[- ]?[0-9]|rollback|deploy(?:ment)? fail|production down/i;

export function findIncidentContext(input: {
  decisions: DecisionHistoryEntry[];
  openBlockers: string[];
}): { summary: string; source: "memory" | "blocker" } | null {
  const incidentMemory = input.decisions.find(
    (entry) => entry.contractCategory === "incident",
  );
  if (incidentMemory?.summary?.trim()) {
    return { summary: incidentMemory.summary.trim(), source: "memory" };
  }

  const blocker = input.openBlockers.find((line) => INCIDENT_PATTERN.test(line));
  if (blocker?.trim()) {
    return { summary: blocker.trim(), source: "blocker" };
  }

  return null;
}

export function formatLineageSummary(item: ExecutionLineageItem): string {
  const { actionMemory, executionOutcome, approvalTraces } = item;
  const parts: string[] = [
    actionMemory.action,
    actionMemory.reason,
    `Outcome: ${actionMemory.outcome.replace(/_/g, " ")}`,
  ];

  if (executionOutcome?.resultSummary?.trim()) {
    parts.push(executionOutcome.resultSummary.trim());
  } else if (executionOutcome?.errorMessage?.trim()) {
    parts.push(executionOutcome.errorMessage.trim());
  }

  const approval = approvalTraces[0];
  if (approval) {
    parts.push(
      `Approval: ${approval.decision}${approval.reason ? ` — ${approval.reason}` : ""}`,
    );
  }

  if (actionMemory.filesChanged.length) {
    parts.push(`Files: ${actionMemory.filesChanged.slice(0, 8).join(", ")}`);
  }

  return parts.filter(Boolean).join("\n");
}
