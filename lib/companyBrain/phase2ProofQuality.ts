import { createHash } from "crypto";
import type {
  CompanyBrainEntityKind,
  CompanyBrainProofQuality,
  CompanyBrainRelation,
  CompanyBrainResolvedEntity,
  Memory,
} from "../memory/types";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function canonicalize(kind: CompanyBrainEntityKind, label: string): string {
  return `${kind}:${label
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^github:/, "")
    .replace(/^jira:/, "")
    .replace(/^linear:/, "")
    .replace(/\/pull\//, "/pull/")
    .replace(/\bpull request\s*#?/g, "pr:")
    .replace(/\bpr\s*#?/g, "pr:")
    .replace(/\s+/g, "_")
    .replace(/[^\w:./#-]+/g, "")
    .slice(0, 180)}`;
}

function entityId(kind: CompanyBrainEntityKind, label: string): string {
  return `${kind}:${hash(canonicalize(kind, label))}`;
}

function addEntity(
  entities: Map<string, CompanyBrainResolvedEntity>,
  input: {
    kind: CompanyBrainEntityKind;
    label?: string | null;
    reference?: string | null;
    memory: Memory;
    confidence?: number;
  },
): void {
  const label = normalizeLabel(input.label ?? "");
  if (!label) return;
  const id = entityId(input.kind, label);
  const reference = input.reference?.trim() || label;
  const alias = label.toLowerCase();
  const existing = entities.get(id);
  if (existing) {
    if (!existing.references.includes(reference)) existing.references.push(reference);
    if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
    if (!existing.memoryIds.includes(input.memory.id)) existing.memoryIds.push(input.memory.id);
    existing.evidenceCount += 1;
    existing.confidence = Math.max(existing.confidence, input.confidence ?? input.memory.confidence);
    if (new Date(input.memory.updatedAt).getTime() > new Date(existing.latestMemoryAt).getTime()) {
      existing.latestMemoryAt = input.memory.updatedAt;
    }
    return;
  }
  entities.set(id, {
    id,
    kind: input.kind,
    label,
    canonicalId: canonicalize(input.kind, label),
    aliases: [alias],
    references: [reference],
    evidenceCount: 1,
    memoryIds: [input.memory.id],
    latestMemoryAt: input.memory.updatedAt,
    confidence: input.confidence ?? input.memory.confidence,
  });
}

function addEntityFromEdgeRef(
  entities: Map<string, CompanyBrainResolvedEntity>,
  memory: Memory,
  edgeRef: string,
): void {
  const [prefix, ...rest] = edgeRef.split(":");
  const value = rest.join(":").trim();
  if (!value || prefix === "dedupe" || prefix === "entity" || prefix === "relation") return;
  if (prefix === "project") addEntity(entities, { kind: "project", label: value, reference: edgeRef, memory });
  if (prefix === "workspace") addEntity(entities, { kind: "workspace", label: value, reference: edgeRef, memory });
  if (prefix === "thread") addEntity(entities, { kind: "thread", label: value, reference: edgeRef, memory });
  if (prefix === "agent") addEntity(entities, { kind: "agent", label: value, reference: edgeRef, memory });
  if (prefix === "memory") addEntity(entities, { kind: "memory_ref", label: value, reference: edgeRef, memory });
  if (prefix === "file") addEntity(entities, { kind: "file", label: value, reference: edgeRef, memory });
  if (prefix === "test") addEntity(entities, { kind: "test", label: value, reference: edgeRef, memory });
}

export function resolveCompanyBrainEntities(memories: Memory[]): CompanyBrainResolvedEntity[] {
  const entities = new Map<string, CompanyBrainResolvedEntity>();
  const fileRegex = /\b(?:[\w.-]+\/)+[\w.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|sql|prisma|py|go|rs|java|rb|php|css|scss)\b/g;
  const repoRegex = /\b[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\b/g;
  const issueRegex = /\b(?:[A-Z][A-Z0-9]+-\d+|#\d+|issues\/\d+|linear:[A-Z][A-Z0-9]+-\d+|jira:[A-Z][A-Z0-9]+-\d+)\b/g;
  const pullRequestRegex = /\b(?:github:)?(?:pull\/\d+|pull request\s*#?\d+|pr\s*#?\d+|\/pull\/\d+)\b/gi;
  const serviceRegex = /\b(?:api|web|worker|backend|frontend|gateway|database|postgres|redis|queue|scheduler|billing|auth|slack|github|linear|jira|devin|codex|sentry|vercel|cloudflare|aws|gcp|azure|kubernetes|docker|terraform)\b/gi;
  const testRegex = /\b(?:npm|pnpm|bun|yarn|npx)\s+(?:run\s+)?[\w:.-]+(?:\s+--[\w:./=-]+)*/g;
  const customerRegex = /\b(?:customer|tenant|workspace|org)[\s:_-]+([A-Za-z0-9_.-]{3,80})\b/gi;
  const policyRegex = /\b(?:approval|permission|policy|risk rule|forbidden action|human approval)\b/gi;

  for (const memory of memories) {
    for (const persisted of memory.entities ?? []) {
      const existing = entities.get(persisted.id);
      if (!existing) {
        entities.set(persisted.id, { ...persisted });
        continue;
      }
      for (const reference of persisted.references) if (!existing.references.includes(reference)) existing.references.push(reference);
      for (const alias of persisted.aliases) if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
      for (const memoryId of persisted.memoryIds) if (!existing.memoryIds.includes(memoryId)) existing.memoryIds.push(memoryId);
      existing.evidenceCount += persisted.evidenceCount;
      existing.confidence = Math.max(existing.confidence, persisted.confidence);
    }

    addEntity(entities, {
      kind: "memory_type",
      label: memory.companyBrainType ?? memory.contractCategory ?? memory.type,
      reference: memory.sourceRef ?? memory.id,
      memory,
    });
    addEntity(entities, {
      kind: "source",
      label: memory.traceProof?.sourceType ?? memory.sourceRef?.split(":")[0] ?? memory.source,
      reference: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
      memory,
    });

    for (const edgeRef of memory.graph?.edgeRefs ?? []) addEntityFromEdgeRef(entities, memory, edgeRef);
    for (const file of memory.files ?? []) addEntity(entities, { kind: "file", label: file, reference: file, memory });
    for (const conflictRef of memory.conflict?.conflictsWith ?? []) {
      addEntity(entities, { kind: "memory_ref", label: conflictRef, reference: conflictRef, memory });
    }

    const haystack = [
      memory.summary,
      memory.content,
      memory.sourceRef,
      ...(memory.traceProof?.evidence ?? []),
      ...(memory.graph?.edgeRefs ?? []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join("\n");

    for (const match of haystack.matchAll(fileRegex)) addEntity(entities, { kind: "file", label: match[0], reference: match[0], memory });
    for (const match of haystack.matchAll(repoRegex)) {
      const value = match[0];
      if (value.includes(".") || value.includes("://")) continue;
      addEntity(entities, { kind: "repo", label: value, reference: value, memory });
    }
    for (const match of haystack.matchAll(issueRegex)) addEntity(entities, { kind: "issue", label: match[0], reference: match[0], memory });
    for (const match of haystack.matchAll(pullRequestRegex)) addEntity(entities, { kind: "pull_request", label: match[0], reference: match[0], memory });
    for (const match of haystack.matchAll(serviceRegex)) addEntity(entities, { kind: "service", label: match[0].toLowerCase(), reference: match[0], memory });
    for (const match of haystack.matchAll(testRegex)) addEntity(entities, { kind: "test", label: match[0], reference: match[0], memory });
    for (const match of haystack.matchAll(customerRegex)) addEntity(entities, { kind: "customer", label: match[1], reference: match[0], memory });
    for (const match of haystack.matchAll(policyRegex)) addEntity(entities, { kind: "policy", label: match[0], reference: match[0], memory });
  }

  return [...entities.values()]
    .sort((left, right) => {
      if (right.evidenceCount !== left.evidenceCount) return right.evidenceCount - left.evidenceCount;
      return new Date(right.latestMemoryAt).getTime() - new Date(left.latestMemoryAt).getTime();
    })
    .slice(0, 180);
}

export function buildCompanyBrainRelations(
  memory: Memory,
  entities: CompanyBrainResolvedEntity[],
): CompanyBrainRelation[] {
  const byKind = new Map<CompanyBrainEntityKind, CompanyBrainResolvedEntity[]>();
  for (const entity of entities) {
    byKind.set(entity.kind, [...(byKind.get(entity.kind) ?? []), entity]);
  }
  const sources = byKind.get("source") ?? [];
  const projects = byKind.get("project") ?? [];
  const memoryTypes = byKind.get("memory_type") ?? [];
  const evidence = [
    ...(memory.traceProof?.evidence ?? []),
    memory.traceProof?.sourceRef,
    memory.sourceRef,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const relations: CompanyBrainRelation[] = [];
  const addRelation = (
    from: CompanyBrainResolvedEntity | undefined,
    to: CompanyBrainResolvedEntity | undefined,
    relationType: CompanyBrainRelation["relationType"],
    confidence = Math.min(memory.confidence, from?.confidence ?? memory.confidence, to?.confidence ?? memory.confidence),
  ) => {
    if (!from || !to || from.id === to.id) return;
    const id = `${relationType}:${hash(`${from.id}->${to.id}:${memory.id}`)}`;
    if (relations.some((relation) => relation.id === id)) return;
    relations.push({
      id,
      fromEntityId: from.id,
      toEntityId: to.id,
      relationType,
      evidenceRefs: evidence,
      memoryIds: [memory.id],
      confidence,
    });
  };

  for (const project of projects) {
    for (const entity of entities) addRelation(project, entity, "scopes", 0.86);
  }
  for (const source of sources) {
    for (const entity of entities.filter((item) => item.kind !== "source")) addRelation(source, entity, "evidenced_by");
  }
  for (const agent of byKind.get("agent") ?? []) {
    for (const memoryType of memoryTypes) addRelation(memoryType, agent, "inherits_to", 0.84);
  }
  for (const memoryType of memoryTypes) {
    for (const conflict of byKind.get("memory_ref") ?? []) addRelation(memoryType, conflict, "conflicts_with", 0.9);
  }
  for (const file of byKind.get("file") ?? []) {
    for (const test of byKind.get("test") ?? []) addRelation(file, test, "validated_by", 0.82);
  }

  return relations.slice(0, 80);
}

export function assessCompanyBrainProofQuality(
  memory: Memory,
  entities: CompanyBrainResolvedEntity[] = memory.entities ?? [],
  relations: CompanyBrainRelation[] = memory.relations ?? [],
): CompanyBrainProofQuality {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  if (memory.traceProof?.sourceRef || memory.sourceRef) {
    score += 20;
    reasons.push("source_ref_present");
  } else {
    gaps.push("missing_source_ref");
  }
  if ((memory.traceProof?.evidence?.length ?? 0) > 0 || memory.evidenceCount > 0) {
    score += 20;
    reasons.push("evidence_present");
  } else {
    gaps.push("missing_evidence");
  }
  if ((memory.graph?.edgeRefs?.length ?? 0) > 0) {
    score += 12;
    reasons.push("graph_edges_present");
  } else {
    gaps.push("missing_graph_edges");
  }
  if (entities.length > 0) {
    score += 18;
    reasons.push("entities_resolved");
  } else {
    gaps.push("missing_resolved_entities");
  }
  if (relations.length > 0) {
    score += 10;
    reasons.push("relations_materialized");
  } else {
    gaps.push("missing_relations");
  }
  if (memory.confidence >= 0.8) {
    score += 10;
    reasons.push("high_confidence");
  } else if (memory.confidence >= 0.65) {
    score += 6;
    reasons.push("medium_confidence");
  } else {
    gaps.push("low_confidence");
  }
  if (memory.freshness?.status === "fresh") {
    score += 10;
    reasons.push("fresh_memory");
  } else if (memory.freshness?.status === "aging") {
    score += 5;
    reasons.push("aging_memory");
  } else {
    gaps.push("stale_or_unknown_freshness");
  }

  const blocked = memory.conflict?.status === "possible_conflict" || memory.status === "contradicted";
  if (blocked) {
    score = Math.min(score, 55);
    gaps.push("unresolved_conflict_blocks_inheritance");
  } else {
    reasons.push("conflict_free");
  }
  if (memory.status === "stale" || memory.freshness?.status === "stale") {
    score = Math.min(score, 60);
    gaps.push("stale_memory_needs_review");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const status: CompanyBrainProofQuality["status"] = blocked
    ? "blocked"
    : boundedScore >= 85
      ? "strong"
      : boundedScore >= 65
        ? "usable"
        : boundedScore >= 40
          ? "weak"
          : "blocked";

  return {
    score: boundedScore,
    status,
    productionReady: status === "strong" || status === "usable",
    reasons: [...new Set(reasons)],
    gaps: [...new Set(gaps)],
    assessedAt: new Date().toISOString(),
  };
}
