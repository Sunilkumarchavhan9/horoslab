import { randomUUID } from "crypto";
import type { Memory, MemoryContractCategory } from "../memory/types";

export const OPERATIONAL_MAP_NODE_TYPES = [
  "Project",
  "Repository",
  "Decision",
  "Runbook",
  "Incident",
  "Issue",
  "PR",
  "Blocker",
  "Risk",
  "Owner",
] as const;

export type OperationalMapNodeType = (typeof OPERATIONAL_MAP_NODE_TYPES)[number];

export const OPERATIONAL_MAP_EDGE_RELATIONS = [
  "relates_to",
  "blocks",
  "documents",
  "owned_by",
] as const;

export type OperationalMapEdgeRelation = (typeof OPERATIONAL_MAP_EDGE_RELATIONS)[number];

export type OperationalMapNode = {
  id: string;
  type: OperationalMapNodeType;
  label: string;
  confidence: number;
  sourceMemoryIds: string[];
  contractCategory?: MemoryContractCategory;
  attributes?: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type OperationalMapEdge = {
  id: string;
  from: string;
  to: string;
  relation: OperationalMapEdgeRelation;
  confidence: number;
  sourceMemoryIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
};

export type ConnectorMemoryHint = {
  memoryId: string;
  sourceType?: string;
  repository?: string;
  externalKind?: "pr" | "issue";
  externalNumber?: number;
};

export type CompileOperationalMapInput = {
  memories: Memory[];
  connectorHints?: ConnectorMemoryHint[];
  now?: string;
};

export type CompileOperationalMapResult = {
  nodes: OperationalMapNode[];
  edges: OperationalMapEdge[];
};

type GraphNode = {
  id: string;
  type: "person" | "team" | "system" | "policy" | "incident" | "decision" | "runbook" | "risk";
  label: string;
  confidence: number;
  evidenceMemoryIds: string[];
  sourceTypes: Array<
    | "github"
    | "notion"
    | "local_files"
    | "slack"
    | "gmail"
    | "zendesk"
    | "jira"
    | "support"
    | "crm"
    | "db"
  >;
  firstSeenAt: string;
  lastSeenAt: string;
  attributes?: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation:
    | "owns"
    | "depends_on"
    | "blocked_by"
    | "resolved_by"
    | "governed_by"
    | "implements"
    | "escalates_to"
    | "mitigates"
    | "informs"
    | "decides_for";
  confidence: number;
  evidenceMemoryIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
};

const CONTRACT_NODE_TYPE: Partial<Record<MemoryContractCategory, OperationalMapNodeType>> = {
  decision: "Decision",
  runbook: "Runbook",
  incident: "Incident",
  blocker: "Blocker",
  bug: "Issue",
  risky_file: "Risk",
  policy: "Decision",
  architecture_note: "Decision",
  previous_attempt: "Decision",
  model_tool_update: "Decision",
  next_action: "Decision",
  preference: "Decision",
};

const CONTRACT_CONFIDENCE: Partial<Record<MemoryContractCategory, number>> = {
  decision: 0.88,
  runbook: 0.84,
  incident: 0.86,
  blocker: 0.82,
  bug: 0.8,
  risky_file: 0.78,
  policy: 0.8,
  architecture_note: 0.74,
  previous_attempt: 0.7,
  model_tool_update: 0.72,
  next_action: 0.76,
  preference: 0.68,
};

export function resolveMapCompilerMode(): "contract" | "legacy" {
  const raw = process.env.COMPANY_BRAIN_MAP_COMPILER?.trim().toLowerCase();
  if (raw === "legacy") return "legacy";
  if (raw === "contract") return "contract";
  return process.env.NODE_ENV === "development" ? "contract" : "legacy";
}

function memorySeenAt(memory: Memory, fallback: string): string {
  if (typeof memory.updatedAt === "string") return memory.updatedAt;
  if (typeof memory.createdAt === "string") return memory.createdAt;
  return fallback;
}

function inferSourceType(memory: Memory): GraphNode["sourceTypes"][number] {
  if (memory.source === "import") return "local_files";
  const corpus = `${memory.summary ?? ""} ${memory.content ?? ""}`.toLowerCase();
  if (/\bgithub\b/.test(corpus) || /\bgit hub pr\b/i.test(corpus)) return "github";
  if (/\bnotion\b/.test(corpus)) return "notion";
  if (/\bslack\b/.test(corpus)) return "slack";
  if (/\bgmail\b/.test(corpus)) return "gmail";
  if (/\bjira\b/.test(corpus)) return "jira";
  if (/\bzendesk|freshdesk|support ticket|refund\b/.test(corpus)) return "support";
  if (/\bhubspot|salesforce|crm\b/.test(corpus)) return "crm";
  if (/\bpostgres|mysql|database|sql\b/.test(corpus)) return "db";
  return "local_files";
}

function parseGithubArtifact(memory: Memory): {
  kind: "pr" | "issue";
  repository?: string;
  number?: number;
} | null {
  const corpus = `${memory.summary} ${memory.content}`;
  const prMatch = corpus.match(/GitHub PR\s+([^:\n]+)/i);
  if (prMatch) {
    const repo = corpus.match(/\b([\w.-]+\/[\w.-]+)\b/);
    const num = corpus.match(/#(\d+)\b/);
    return {
      kind: "pr",
      repository: repo?.[1],
      number: num ? Number(num[1]) : undefined,
    };
  }
  const issueMatch = corpus.match(/GitHub Issue\s+([^:\n]+)/i);
  if (issueMatch) {
    const repo = corpus.match(/\b([\w.-]+\/[\w.-]+)\b/);
    const num = corpus.match(/#(\d+)\b/);
    return {
      kind: "issue",
      repository: repo?.[1],
      number: num ? Number(num[1]) : undefined,
    };
  }
  return null;
}

function nodeId(type: OperationalMapNodeType, memoryId: string, suffix?: string): string {
  const base = `${type.toLowerCase()}:${memoryId}`;
  return suffix ? `${base}:${suffix}` : base;
}

function mergeNode(
  nodes: Map<string, OperationalMapNode>,
  node: OperationalMapNode,
): void {
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return;
  }
  existing.confidence = Math.max(existing.confidence, node.confidence);
  for (const memoryId of node.sourceMemoryIds) {
    if (!existing.sourceMemoryIds.includes(memoryId)) {
      existing.sourceMemoryIds.push(memoryId);
    }
  }
  existing.lastSeenAt = node.lastSeenAt;
  if (node.attributes) {
    existing.attributes = { ...(existing.attributes ?? {}), ...node.attributes };
  }
}

function mergeEdge(
  edges: Map<string, OperationalMapEdge>,
  edge: OperationalMapEdge,
): void {
  const key = `${edge.from}|${edge.relation}|${edge.to}`;
  const existing = edges.get(key);
  if (!existing) {
    edges.set(key, edge);
    return;
  }
  existing.confidence = Math.max(existing.confidence, edge.confidence);
  for (const memoryId of edge.sourceMemoryIds) {
    if (!existing.sourceMemoryIds.includes(memoryId)) {
      existing.sourceMemoryIds.push(memoryId);
    }
  }
  existing.lastSeenAt = edge.lastSeenAt;
}

function addEdge(
  edges: Map<string, OperationalMapEdge>,
  nodes: Map<string, OperationalMapNode>,
  from: string,
  to: string,
  relation: OperationalMapEdgeRelation,
  confidence: number,
  memoryId: string,
  seenAt: string,
): void {
  if (!nodes.has(from) || !nodes.has(to) || from === to) return;
  mergeEdge(edges, {
    id: randomUUID(),
    from,
    to,
    relation,
    confidence,
    sourceMemoryIds: [memoryId],
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
  });
}

export function compileOperationalMap(input: CompileOperationalMapInput): CompileOperationalMapResult {
  const now = input.now ?? new Date().toISOString();
  const nodes = new Map<string, OperationalMapNode>();
  const edges = new Map<string, OperationalMapEdge>();
  const hintsByMemory = new Map(
    (input.connectorHints ?? []).map((hint) => [hint.memoryId, hint] as const),
  );

  for (const memory of input.memories) {
    const seenAt = memorySeenAt(memory, now);
    const hint = hintsByMemory.get(memory.id);
    const label = memory.summary?.trim() || memory.content.slice(0, 120).trim() || memory.id;
    const category = memory.contractCategory;
    const contractNodeType = category ? CONTRACT_NODE_TYPE[category] : undefined;

    if (memory.type === "project") {
      const projectId = nodeId("Project", memory.id);
      mergeNode(nodes, {
        id: projectId,
        type: "Project",
        label,
        confidence: 0.75,
        sourceMemoryIds: [memory.id],
        attributes: { memoryType: memory.type },
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
    }

    const projectAreas = memory.developerSignals?.projectArea ?? [];
    for (const area of projectAreas) {
      const areaLabel = area.trim();
      if (!areaLabel) continue;
      mergeNode(nodes, {
        id: `project:area:${areaLabel.toLowerCase().replace(/\s+/g, "_")}`,
        type: "Project",
        label: areaLabel,
        confidence: 0.7,
        sourceMemoryIds: [memory.id],
        attributes: { fromDeveloperSignals: true },
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
    }

    const githubArtifact =
      hint?.externalKind && hint.repository
        ? {
            kind: hint.externalKind,
            repository: hint.repository,
            number: hint.externalNumber,
          }
        : parseGithubArtifact(memory);

    if (githubArtifact?.repository) {
      const repoId = `repository:${githubArtifact.repository.replace(/\//g, "_")}`;
      mergeNode(nodes, {
        id: repoId,
        type: "Repository",
        label: githubArtifact.repository,
        confidence: 0.82,
        sourceMemoryIds: [memory.id],
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
    }

    if (githubArtifact?.kind === "pr") {
      const prId = nodeId("PR", memory.id);
      const prLabel =
        githubArtifact.number !== undefined
          ? `PR #${githubArtifact.number}: ${label}`
          : label;
      mergeNode(nodes, {
        id: prId,
        type: "PR",
        label: prLabel,
        confidence: 0.85,
        sourceMemoryIds: [memory.id],
        contractCategory: category,
        attributes: {
          repository: githubArtifact.repository,
          number: githubArtifact.number,
        },
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
      if (githubArtifact.repository) {
        addEdge(
          edges,
          nodes,
          prId,
          `repository:${githubArtifact.repository.replace(/\//g, "_")}`,
          "relates_to",
          0.8,
          memory.id,
          seenAt,
        );
      }
    }

    if (githubArtifact?.kind === "issue") {
      const issueId = nodeId("Issue", memory.id);
      mergeNode(nodes, {
        id: issueId,
        type: "Issue",
        label,
        confidence: 0.83,
        sourceMemoryIds: [memory.id],
        contractCategory: category,
        attributes: {
          repository: githubArtifact.repository,
          number: githubArtifact.number,
        },
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
      if (githubArtifact.repository) {
        addEdge(
          edges,
          nodes,
          issueId,
          `repository:${githubArtifact.repository.replace(/\//g, "_")}`,
          "relates_to",
          0.79,
          memory.id,
          seenAt,
        );
      }
    }

    if (contractNodeType && category) {
      const primaryId = nodeId(contractNodeType, memory.id);
      mergeNode(nodes, {
        id: primaryId,
        type: contractNodeType,
        label,
        confidence: CONTRACT_CONFIDENCE[category] ?? 0.72,
        sourceMemoryIds: [memory.id],
        contractCategory: category,
        attributes: {
          summary: memory.summary,
          memoryType: memory.type,
        },
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });

      if (memory.type === "project") {
        addEdge(edges, nodes, primaryId, nodeId("Project", memory.id), "relates_to", 0.74, memory.id, seenAt);
      }

      if (category === "risky_file" && githubArtifact?.repository) {
        addEdge(
          edges,
          nodes,
          primaryId,
          `repository:${githubArtifact.repository.replace(/\//g, "_")}`,
          "relates_to",
          0.76,
          memory.id,
          seenAt,
        );
      }
    }

    const ownerCandidates = [
      ...(memory.developerSignals?.goal ?? []),
    ];
    for (const ownerLabel of ownerCandidates) {
      const trimmed = ownerLabel.trim();
      if (!trimmed || trimmed.length > 48) continue;
      const ownerId = `owner:${trimmed.toLowerCase().replace(/\s+/g, "_")}`;
      mergeNode(nodes, {
        id: ownerId,
        type: "Owner",
        label: trimmed,
        confidence: 0.65,
        sourceMemoryIds: [memory.id],
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      });
      const projectNode = nodes.get(nodeId("Project", memory.id)) ?? nodes.get(`project:area:${trimmed.toLowerCase().replace(/\s+/g, "_")}`);
      if (projectNode) {
        addEdge(edges, nodes, ownerId, projectNode.id, "owned_by", 0.7, memory.id, seenAt);
      }
    }
  }

  const decisionNodes = Array.from(nodes.values()).filter((node) => node.type === "Decision");
  const runbookNodes = Array.from(nodes.values()).filter((node) => node.type === "Runbook");
  const incidentNodes = Array.from(nodes.values()).filter((node) => node.type === "Incident");
  const blockerNodes = Array.from(nodes.values()).filter((node) => node.type === "Blocker");

  for (const runbook of runbookNodes) {
    const incidentPeer = incidentNodes[0];
    if (incidentPeer) {
      const memoryId = runbook.sourceMemoryIds[0] ?? incidentPeer.sourceMemoryIds[0] ?? "map-link";
      addEdge(
        edges,
        nodes,
        runbook.id,
        incidentPeer.id,
        "documents",
        0.81,
        memoryId,
        runbook.lastSeenAt,
      );
    }
  }

  for (const decision of decisionNodes) {
    const runbookPeer = runbookNodes.find((node) => node.id !== decision.id);
    if (runbookPeer) {
      const memoryId = decision.sourceMemoryIds[0] ?? runbookPeer.sourceMemoryIds[0] ?? "map-link";
      addEdge(
        edges,
        nodes,
        decision.id,
        runbookPeer.id,
        "relates_to",
        0.77,
        memoryId,
        decision.lastSeenAt,
      );
    }
  }

  for (const blocker of blockerNodes) {
    const decisionPeer = decisionNodes.find((node) => node.id !== blocker.id);
    const incidentPeer = incidentNodes.find((node) => node.id !== blocker.id);
    const memoryId = blocker.sourceMemoryIds[0] ?? "map-link";
    if (decisionPeer) {
      addEdge(edges, nodes, blocker.id, decisionPeer.id, "blocks", 0.8, memoryId, blocker.lastSeenAt);
    }
    if (incidentPeer) {
      addEdge(edges, nodes, blocker.id, incidentPeer.id, "blocks", 0.78, memoryId, blocker.lastSeenAt);
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

function operationalNodeToGraphType(node: OperationalMapNode): GraphNode["type"] {
  if (node.contractCategory === "policy") return "policy";
  switch (node.type) {
    case "Decision":
      return "decision";
    case "Runbook":
      return "runbook";
    case "Incident":
      return "incident";
    case "Blocker":
    case "Risk":
      return "risk";
    case "Owner":
      return "person";
    default:
      return "system";
  }
}

function operationalEdgeToGraphRelation(
  relation: OperationalMapEdgeRelation,
): GraphEdge["relation"] {
  switch (relation) {
    case "blocks":
      return "blocked_by";
    case "documents":
      return "implements";
    case "owned_by":
      return "owns";
    default:
      return "informs";
  }
}

export function operationalMapToGraphStore(
  map: CompileOperationalMapResult,
  memories: Memory[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const sourceByMemory = new Map(memories.map((memory) => [memory.id, inferSourceType(memory)]));
  const nodes: GraphNode[] = map.nodes.map((node) => {
    const sourceTypes = Array.from(
      new Set(
        node.sourceMemoryIds
          .map((memoryId) => sourceByMemory.get(memoryId))
          .filter((value): value is GraphNode["sourceTypes"][number] => Boolean(value)),
      ),
    );
    return {
      id: node.id,
      type: operationalNodeToGraphType(node),
      label: node.label,
      confidence: node.confidence,
      evidenceMemoryIds: [...node.sourceMemoryIds],
      sourceTypes: sourceTypes.length > 0 ? sourceTypes : ["local_files"],
      firstSeenAt: node.firstSeenAt,
      lastSeenAt: node.lastSeenAt,
      attributes: {
        operationalType: node.type,
        ...(node.contractCategory ? { contractCategory: node.contractCategory } : {}),
        ...(node.attributes ?? {}),
      },
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = map.edges
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      relation: operationalEdgeToGraphRelation(edge.relation),
      confidence: edge.confidence,
      evidenceMemoryIds: [...edge.sourceMemoryIds],
      firstSeenAt: edge.firstSeenAt,
      lastSeenAt: edge.lastSeenAt,
    }));

  return { nodes, edges };
}

/** Regex-based graph build kept for one release as fallback. */
export function compileOperationalMapLegacy(
  memories: Memory[],
  now: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  function ensureNode(
    id: string,
    type: GraphNode["type"],
    label: string,
    confidence: number,
    evidenceMemoryId: string,
    sourceType: GraphNode["sourceTypes"][number],
    seenAt: string,
    attributes?: Record<string, unknown>,
  ): void {
    const existing = nodes.get(id);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, confidence);
      if (!existing.evidenceMemoryIds.includes(evidenceMemoryId)) {
        existing.evidenceMemoryIds.push(evidenceMemoryId);
      }
      if (!existing.sourceTypes.includes(sourceType)) {
        existing.sourceTypes.push(sourceType);
      }
      existing.lastSeenAt = seenAt;
      if (attributes) {
        existing.attributes = { ...(existing.attributes ?? {}), ...attributes };
      }
      return;
    }
    nodes.set(id, {
      id,
      type,
      label,
      confidence,
      evidenceMemoryIds: [evidenceMemoryId],
      sourceTypes: [sourceType],
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      ...(attributes ? { attributes } : {}),
    });
  }

  function addEdge(
    from: string,
    to: string,
    relation: GraphEdge["relation"],
    confidence: number,
    evidenceMemoryId: string,
    seenAt: string,
  ): void {
    if (!nodes.has(from) || !nodes.has(to) || from === to) return;
    const key = `${from}|${relation}|${to}`;
    const existing = edges.get(key);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, confidence);
      if (!existing.evidenceMemoryIds.includes(evidenceMemoryId)) {
        existing.evidenceMemoryIds.push(evidenceMemoryId);
      }
      existing.lastSeenAt = seenAt;
      return;
    }
    edges.set(key, {
      id: randomUUID(),
      from,
      to,
      relation,
      confidence,
      evidenceMemoryIds: [evidenceMemoryId],
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
    });
  }

  const teamPattern = /\b(platform|infra|security|billing|support|ops|product|engineering|frontend|backend)\s+team\b/gi;
  const systemPattern = /\b(github|notion|slack|gmail|postgres|redis|kubernetes|docker|api|memoryos|polar|clerk)\b/gi;
  const personPattern = /\b(?:from|owner|by|lead|assignee)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;
  const relationPattern = /\b(depends on|blocked by|owned by|governed by|implements|resolved by)\b/i;
  const decisionPattern = /\bdecide|decision|approved|approval|ship\b/i;
  const policyPattern = /\bpolicy|compliance|rule|governance\b/i;
  const incidentPattern = /\bincident|outage|bug|rollback|degraded\b/i;
  const runbookPattern = /\brunbook|procedure|playbook|steps|checklist\b/i;

  for (const memory of memories) {
    const raw = `${memory.summary} ${memory.content}`;
    const text = raw.toLowerCase();
    const idBase = memory.id;
    const sourceType = inferSourceType(memory);
    const seenAt = memorySeenAt(memory, now);

    if (memory.operationalTags?.includes("decision") || decisionPattern.test(text)) {
      ensureNode(`decision:${idBase}`, "decision", memory.summary, 0.8, memory.id, sourceType, seenAt);
    }
    if (memory.operationalTags?.includes("policy") || policyPattern.test(text)) {
      ensureNode(`policy:${idBase}`, "policy", memory.summary, 0.75, memory.id, sourceType, seenAt);
    }
    if (memory.operationalTags?.includes("incident") || incidentPattern.test(text)) {
      ensureNode(`incident:${idBase}`, "incident", memory.summary, 0.78, memory.id, sourceType, seenAt);
    }
    if (memory.operationalTags?.includes("runbook") || runbookPattern.test(text)) {
      ensureNode(`runbook:${idBase}`, "runbook", memory.summary, 0.74, memory.id, sourceType, seenAt);
    }
    if (/\brisk|risky|impact|blast radius\b/.test(text)) {
      ensureNode(`risk:${idBase}`, "risk", memory.summary, 0.66, memory.id, sourceType, seenAt);
    }

    for (const match of raw.matchAll(teamPattern)) {
      const label = `${match[1].toLowerCase()} team`;
      ensureNode(`team:${label.replace(/\s+/g, "_")}`, "team", label, 0.7, memory.id, sourceType, seenAt);
    }
    for (const match of raw.matchAll(systemPattern)) {
      const label = match[1].toLowerCase();
      ensureNode(`system:${label}`, "system", label, 0.68, memory.id, sourceType, seenAt);
    }
    for (const match of raw.matchAll(personPattern)) {
      const label = match[1].trim();
      ensureNode(
        `person:${label.toLowerCase().replace(/\s+/g, "_")}`,
        "person",
        label,
        0.65,
        memory.id,
        sourceType,
        seenAt,
      );
    }

    const decisionId = `decision:${idBase}`;
    const policyId = `policy:${idBase}`;
    const incidentId = `incident:${idBase}`;
    const runbookId = `runbook:${idBase}`;
    const riskId = `risk:${idBase}`;

    if (nodes.has(decisionId) && nodes.has(policyId)) addEdge(decisionId, policyId, "governed_by", 0.71, memory.id, seenAt);
    if (nodes.has(decisionId) && nodes.has(runbookId)) addEdge(decisionId, runbookId, "implements", 0.69, memory.id, seenAt);
    if (nodes.has(incidentId) && nodes.has(runbookId)) addEdge(incidentId, runbookId, "resolved_by", 0.72, memory.id, seenAt);
    if (nodes.has(incidentId) && nodes.has(policyId)) addEdge(incidentId, policyId, "governed_by", 0.64, memory.id, seenAt);
    if (nodes.has(incidentId) && nodes.has(riskId)) addEdge(incidentId, riskId, "depends_on", 0.62, memory.id, seenAt);
    if (nodes.has(runbookId) && nodes.has(riskId)) addEdge(runbookId, riskId, "mitigates", 0.68, memory.id, seenAt);
    if (nodes.has(policyId) && nodes.has(decisionId)) addEdge(policyId, decisionId, "informs", 0.63, memory.id, seenAt);

    if (relationPattern.test(text)) {
      if (text.includes("blocked by") && nodes.has(incidentId) && nodes.has(policyId)) {
        addEdge(incidentId, policyId, "blocked_by", 0.67, memory.id, seenAt);
      }
      if (text.includes("depends on") && nodes.has(decisionId) && nodes.has(runbookId)) {
        addEdge(decisionId, runbookId, "depends_on", 0.66, memory.id, seenAt);
      }
    }
  }

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}
