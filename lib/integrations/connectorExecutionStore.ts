import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type ConnectorExecutionType = "slack" | "jira";

export type ConnectorExecutionKind = "slack_channel_message" | "jira_issue_comment";

export type ConnectorExecutionProposal = {
  id: string;
  userId: string;
  connectorType: ConnectorExecutionType;
  kind: ConnectorExecutionKind;
  targetId: string;
  targetLabel: string | null;
  body: string;
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  createdAt: string;
  reviewedAt: string | null;
  executedAt: string | null;
  resultUrl: string | null;
  externalId: string | null;
  error: string | null;
};

function normalizeProposal(raw: Partial<ConnectorExecutionProposal>): ConnectorExecutionProposal {
  const connectorType: ConnectorExecutionType =
    raw.connectorType === "jira" ? "jira" : "slack";
  const kind: ConnectorExecutionKind =
    raw.kind === "jira_issue_comment" ? "jira_issue_comment" : "slack_channel_message";
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    connectorType,
    kind,
    targetId: String(raw.targetId ?? ""),
    targetLabel: typeof raw.targetLabel === "string" ? raw.targetLabel : null,
    body: String(raw.body ?? ""),
    status:
      raw.status === "approved" ||
      raw.status === "executed" ||
      raw.status === "rejected" ||
      raw.status === "failed"
        ? raw.status
        : "pending",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : null,
    executedAt: typeof raw.executedAt === "string" ? raw.executedAt : null,
    resultUrl: typeof raw.resultUrl === "string" ? raw.resultUrl : null,
    externalId: typeof raw.externalId === "string" ? raw.externalId : null,
    error: typeof raw.error === "string" ? raw.error : null,
  };
}

function rowToProposal(row: {
  id: string;
  userId: string;
  connectorType: string;
  kind: string;
  targetId: string;
  targetLabel: string | null;
  body: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  executedAt: string | null;
  resultUrl: string | null;
  externalId: string | null;
  error: string | null;
}): ConnectorExecutionProposal {
  return normalizeProposal(row as Partial<ConnectorExecutionProposal>);
}

async function persistProposal(proposal: ConnectorExecutionProposal): Promise<void> {
  await prisma.connectorExecutionProposal.upsert({
    where: { id: proposal.id },
    create: proposal,
    update: proposal,
  });
}

export async function createConnectorExecutionProposal(
  input: Omit<
    ConnectorExecutionProposal,
    | "id"
    | "status"
    | "createdAt"
    | "reviewedAt"
    | "executedAt"
    | "resultUrl"
    | "externalId"
    | "error"
  >,
): Promise<ConnectorExecutionProposal> {
  const proposal: ConnectorExecutionProposal = {
    ...input,
    id: `conn_exec_${randomUUID().slice(0, 12)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    executedAt: null,
    resultUrl: null,
    externalId: null,
    error: null,
  };
  await persistProposal(proposal);
  return proposal;
}

export async function listConnectorExecutionProposalsForUser(
  userId: string,
  connectorType?: ConnectorExecutionType,
  limit = 20,
): Promise<ConnectorExecutionProposal[]> {
  const rows = await prisma.connectorExecutionProposal.findMany({
    where: {
      userId,
      ...(connectorType ? { connectorType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 200)),
  });
  return rows.map(rowToProposal);
}

export async function getConnectorExecutionProposal(
  userId: string,
  proposalId: string,
): Promise<ConnectorExecutionProposal | null> {
  const row = await prisma.connectorExecutionProposal.findUnique({
    where: { id: proposalId },
  });
  if (!row) return null;
  const proposal = rowToProposal(row);
  return proposal?.userId === userId ? proposal : null;
}

export async function updateConnectorExecutionProposal(
  proposal: ConnectorExecutionProposal,
): Promise<ConnectorExecutionProposal> {
  await persistProposal(proposal);
  return proposal;
}
