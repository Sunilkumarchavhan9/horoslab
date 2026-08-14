import { RealityRuntime } from "../realityRuntime";
import type { RealityEdge, RealityNode, RealityNodeState, RealityNodeType } from "../models/RealityTypes";
import type { RealitySource } from "../sources/SourceService";

type ConnectorKind = string;

function nowIso(): string {
  return new Date().toISOString();
}

function slugId(value: string): string {
  const compacted = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return compacted || "node";
}

function titleFromType(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function connectorLabel(value: ConnectorKind): string {
  if (value === "github") return "GitHub";
  if (value === "slack") return "Slack";
  if (value === "jira") return "Jira";
  if (value === "notion") return "Notion";
  return titleFromType(value);
}

function upsertNode(input: {
    type: RealityNodeType;
  name: string;
  state?: RealityNodeState;
  metadata?: Record<string, unknown>;
}): RealityNode {
  const nodeId = slugId(input.name);
  const existing = RealityRuntime.getNode(nodeId);
  if (existing) {
    const updated = RealityRuntime.updateNode(nodeId, {
      name: input.name,
      type: input.type,
      state: input.state,
      metadata: input.metadata,
    });
    if (updated) return updated;
  }
  return RealityRuntime.createNode(input);
}

function ensureEdge(input: {
  from: string;
  to: string;
  relationship: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}): RealityEdge | null {
  const existing = RealityRuntime.listEdges().find(
    (edge) => edge.from === input.from && edge.to === input.to && edge.relationship === input.relationship,
  );
  if (existing) {
    return existing;
  }
  return RealityRuntime.connect(input);
}

function recordIngestionEvent(input: {
  nodeId: string;
  type: string;
  source: string;
  payload: Record<string, unknown>;
}): void {
  RealityRuntime.appendEvent({
    nodeId: input.nodeId,
    type: input.type,
    source: input.source,
    payload: {
      ...input.payload,
      recordedAt: nowIso(),
    },
  });
}

export function ingestConnectorSync(input: {
  connectorType: ConnectorKind;
  userId: string;
  orgId?: string | null;
  connectorId: string;
  extractedCount: number;
  checkpoint?: string | null;
  syncAttempts: number;
  status: "success" | "error";
  contractCounts?: Record<string, number>;
  repoFullNames?: string[];
  diagnostics?: Record<string, unknown>;
  error?: string;
}): {
  connection: ReturnType<typeof RealityRuntime.connectSystem> | null;
  source: RealitySource;
  intakeNode: RealityNode;
} {
  const systemLabel = connectorLabel(input.connectorType);
  const sourceMetadata = {
    connectorType: input.connectorType,
    connectorId: input.connectorId,
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    status: input.status,
    extractedCount: input.extractedCount,
    syncAttempts: input.syncAttempts,
    ...(input.checkpoint ? { checkpoint: input.checkpoint } : {}),
    ...(input.contractCounts ? { contractCounts: input.contractCounts } : {}),
    ...(input.repoFullNames?.length ? { repoFullNames: input.repoFullNames } : {}),
    ...(input.diagnostics ? { diagnostics: input.diagnostics } : {}),
    ...(input.error ? { error: input.error } : {}),
  };

  const connection = RealityRuntime.connectSystem(systemLabel, sourceMetadata);
  const source = RealityRuntime.registerSource(systemLabel, sourceMetadata);
  if (input.status === "success" && input.extractedCount > 0) {
    RealityRuntime.indexSource(source.id, input.extractedCount);
  } else {
    RealityRuntime.syncSource(source.id);
  }

  const intakeNodeName = `${systemLabel} Connector ${input.connectorId}`;
  const intakeNode = upsertNode({
    type: "source",
    name: intakeNodeName,
    state: input.status === "success" ? "healthy" : "warning",
    metadata: {
      ...sourceMetadata,
      sourceId: source.id,
      label: `${systemLabel} connector intake`,
    },
  });

  ensureEdge({
    from: "source-graph",
    to: intakeNode.id,
    relationship: "ingests",
    confidence: 0.95,
    metadata: {
      connectorType: input.connectorType,
      connectorId: input.connectorId,
    },
  });
  ensureEdge({
    from: intakeNode.id,
    to: "evidence-index",
    relationship: "feeds",
    confidence: 0.92,
    metadata: {
      connectorType: input.connectorType,
      connectorId: input.connectorId,
    },
  });

  for (const repoFullName of input.repoFullNames ?? []) {
    if (typeof repoFullName !== "string" || repoFullName.trim().length === 0) continue;
    const repositoryNode = upsertNode({
      type: "repository",
      name: repoFullName,
      state: "healthy",
      metadata: {
        provider: input.connectorType,
        connectorId: input.connectorId,
        userId: input.userId,
      },
    });
    ensureEdge({
      from: intakeNode.id,
      to: repositoryNode.id,
      relationship: "tracks",
      confidence: 0.9,
      metadata: {
        connectorType: input.connectorType,
        connectorId: input.connectorId,
      },
    });
  }

  RealityRuntime.recordEvidence({
    nodeId: intakeNode.id,
    title: `${systemLabel} sync ${input.connectorId}`,
    summary: `${systemLabel} sync recorded ${input.extractedCount} extracted item(s) for ${input.userId}.`,
    sourceConnector: input.connectorType,
    sourceId: input.connectorId,
    author: input.userId,
    workspace: input.orgId ?? "memoryos-core",
    confidence: input.status === "success" ? 0.88 : 0.5,
    ...(input.checkpoint ? { timestamp: input.checkpoint } : {}),
    metadata: {
      connectorType: input.connectorType,
      connectorId: input.connectorId,
      extractedCount: input.extractedCount,
      checkpoint: input.checkpoint ?? null,
      syncAttempts: input.syncAttempts,
      contractCounts: input.contractCounts ?? {},
      repoFullNames: input.repoFullNames ?? [],
      status: input.status,
      ...(input.diagnostics ? { diagnostics: input.diagnostics } : {}),
      ...(input.error ? { error: input.error } : {}),
    },
  });

  recordIngestionEvent({
    nodeId: intakeNode.id,
    type: input.status === "success" ? "connector_sync_recorded" : "connector_sync_failed",
    source: "continuity",
    payload: {
      connectorType: input.connectorType,
      connectorId: input.connectorId,
      userId: input.userId,
      ...(input.orgId ? { orgId: input.orgId } : {}),
      extractedCount: input.extractedCount,
      checkpoint: input.checkpoint ?? null,
      syncAttempts: input.syncAttempts,
      contractCounts: input.contractCounts ?? {},
      repoFullNames: input.repoFullNames ?? [],
      status: input.status,
      ...(input.diagnostics ? { diagnostics: input.diagnostics } : {}),
      ...(input.error ? { error: input.error } : {}),
    },
  });

  return { connection, source, intakeNode };
}

export function ingestGitHubCompilation(input: {
  userId: string;
  orgId?: string | null;
  record: {
    repository: string;
    pullRequest: number;
    action: string;
    headSha: string;
    baseSha: string;
    url?: string;
    decision: {
      decision: string;
      riskLevel?: string;
    };
  };
}): RealityNode {
  const sourceMetadata = {
    connectorType: "github",
    repository: input.record.repository,
    pullRequest: input.record.pullRequest,
    action: input.record.action,
    headSha: input.record.headSha,
    baseSha: input.record.baseSha,
    decision: input.record.decision.decision,
    ...(input.record.decision.riskLevel ? { riskLevel: input.record.decision.riskLevel } : {}),
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
  };

  RealityRuntime.connectSystem("GitHub", sourceMetadata);
  const source = RealityRuntime.registerSource("GitHub", sourceMetadata);
  RealityRuntime.indexSource(source.id, 1);

  const repositoryNode = upsertNode({
    type: "repository",
    name: input.record.repository,
    state: "healthy",
    metadata: sourceMetadata,
  });

  ensureEdge({
    from: "source-graph",
    to: repositoryNode.id,
    relationship: "ingests",
    confidence: 0.96,
    metadata: {
      source: "reality-compiler",
      pullRequest: input.record.pullRequest,
      action: input.record.action,
    },
  });
  ensureEdge({
    from: repositoryNode.id,
    to: "evidence-index",
    relationship: "feeds",
    confidence: 0.91,
    metadata: {
      source: "reality-compiler",
      pullRequest: input.record.pullRequest,
      action: input.record.action,
    },
  });

  recordIngestionEvent({
    nodeId: repositoryNode.id,
    type: "github_pull_request_compiled",
    source: "reality-compiler",
    payload: {
      ...sourceMetadata,
      recordedAt: nowIso(),
    },
  });

  RealityRuntime.recordEvidence({
    nodeId: repositoryNode.id,
    title: `${input.record.repository} pull request #${input.record.pullRequest}`,
    summary: `GitHub pull request ${input.record.pullRequest} on ${input.record.repository} was compiled with decision ${input.record.decision.decision}.`,
    sourceConnector: "github",
    sourceId: `${input.record.repository}#${input.record.pullRequest}`,
    author: input.userId,
    workspace: input.orgId ?? "memoryos-core",
    confidence: 0.94,
    ...(input.record.url ? { sourceUrl: input.record.url } : {}),
    metadata: {
      ...sourceMetadata,
      source: "reality-compiler",
    },
  });

  return repositoryNode;
}
