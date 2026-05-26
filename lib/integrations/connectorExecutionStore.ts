import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

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

type Store = {
  proposals: ConnectorExecutionProposal[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "connector-execution-proposals.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

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

function readStore(): Store {
  ensureDir();
  if (!existsSync(STORE_PATH)) return { proposals: [] };
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    const proposals = Array.isArray(parsed.proposals)
      ? parsed.proposals.map((item) =>
          normalizeProposal(item as Partial<ConnectorExecutionProposal>),
        )
      : [];
    return { proposals };
  } catch {
    return { proposals: [] };
  }
}

function writeStore(store: Store): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function createConnectorExecutionProposal(
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
): ConnectorExecutionProposal {
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
  const store = readStore();
  store.proposals.unshift(proposal);
  writeStore(store);
  return proposal;
}

export function listConnectorExecutionProposalsForUser(
  userId: string,
  connectorType?: ConnectorExecutionType,
  limit = 20,
): ConnectorExecutionProposal[] {
  return readStore()
    .proposals.filter(
      (p) => p.userId === userId && (!connectorType || p.connectorType === connectorType),
    )
    .slice(0, limit);
}

export function getConnectorExecutionProposal(
  userId: string,
  proposalId: string,
): ConnectorExecutionProposal | null {
  return (
    readStore().proposals.find((p) => p.userId === userId && p.id === proposalId) ?? null
  );
}

export function updateConnectorExecutionProposal(
  proposal: ConnectorExecutionProposal,
): ConnectorExecutionProposal {
  const store = readStore();
  const index = store.proposals.findIndex((p) => p.id === proposal.id);
  if (index >= 0) store.proposals[index] = proposal;
  else store.proposals.unshift(proposal);
  writeStore(store);
  return proposal;
}
