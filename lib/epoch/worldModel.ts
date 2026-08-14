import { createHash } from "node:crypto";

export type EpochFactClassification = "OBSERVED" | "INFERRED" | "SIMULATED" | "USER_ASSERTED" | "EXTERNAL" | "UNKNOWN";
export type EpochWorldFact = { value: unknown; source: string; observedAt: string; confidence: number; classification: EpochFactClassification };
export type EpochWorldGraph = {
  nodes: Array<{ id: string; kind: "fact"; key: string; value: unknown; confidence: number; source: string }>;
  edges: Array<{ from: string; to: string; relation: "namespace" | "depends_on" }>;
};
export type EpochWorldModelSnapshot = { version: string; capturedAt: string; facts: Record<string, EpochWorldFact>; graph?: EpochWorldGraph; snapshotSha256: string };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function buildEpochWorldModelSnapshot(input: { facts: Record<string, { value: unknown; source: string; confidence?: number; classification?: EpochFactClassification; observedAt?: string }>; previousVersion?: number; capturedAt?: Date }): EpochWorldModelSnapshot {
  const capturedAt = input.capturedAt ?? new Date();
  const facts = Object.fromEntries(Object.entries(input.facts).map(([key, fact]) => [key, { value: fact.value, source: fact.source, observedAt: fact.observedAt ?? capturedAt.toISOString(), confidence: Math.max(0, Math.min(1, fact.confidence ?? 0.5)), classification: fact.classification ?? "UNKNOWN" }]));
  const version = `world-v${(input.previousVersion ?? 0) + 1}`;
  const graph = buildEpochWorldGraph(facts);
  const unsigned = { version, capturedAt: capturedAt.toISOString(), facts, graph };
  return { ...unsigned, snapshotSha256: createHash("sha256").update(canonical(unsigned)).digest("hex") };
}

export function buildEpochWorldGraph(facts: Record<string, EpochWorldFact>): EpochWorldGraph {
  const nodes = Object.entries(facts).map(([key, fact]) => ({ id: `fact:${key}`, kind: "fact" as const, key, value: fact.value, confidence: fact.confidence, source: fact.source }));
  const edges: EpochWorldGraph["edges"] = [];
  for (const node of nodes) {
    const parts = node.key.split(".");
    for (let index = 1; index < parts.length; index += 1) {
      const parent = parts.slice(0, index).join(".");
      if (facts[parent]) edges.push({ from: `fact:${parent}`, to: node.id, relation: "namespace" });
    }
    const dependencies = facts[node.key].value && typeof facts[node.key].value === "object" && !Array.isArray(facts[node.key].value)
      ? (facts[node.key].value as Record<string, unknown>).dependsOn
      : null;
    for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
      if (typeof dependency === "string" && facts[dependency]) edges.push({ from: node.id, to: `fact:${dependency}`, relation: "depends_on" });
    }
  }
  return { nodes, edges };
}

export type EpochWorldFactCandidate = EpochWorldFact & { key: string };
export type EpochWorldFactMerge = { facts: Record<string, EpochWorldFact>; conflicts: Array<{ key: string; candidates: EpochWorldFact[]; selected: EpochWorldFact | null; reason: string }>; staleKeys: string[]; refreshKeys: string[] };

function factScore(fact: EpochWorldFact, now: number, staleAfterMs: number): number {
  const agePenalty = Date.parse(fact.observedAt) + staleAfterMs < now ? 0.25 : 1;
  const classificationWeight = fact.classification === "OBSERVED" ? 1 : fact.classification === "EXTERNAL" ? 0.9 : fact.classification === "USER_ASSERTED" ? 0.8 : 0.6;
  return fact.confidence * agePenalty * classificationWeight;
}

export function mergeEpochWorldFacts(input: { current?: Record<string, EpochWorldFact>; candidates: EpochWorldFactCandidate[]; now?: Date; staleAfterMs?: number }): EpochWorldFactMerge {
  const now = (input.now ?? new Date()).getTime();
  const staleAfterMs = input.staleAfterMs ?? 15 * 60 * 1000;
  const grouped = new Map<string, EpochWorldFact[]>();
  for (const [key, fact] of Object.entries(input.current ?? {})) grouped.set(key, [fact]);
  for (const candidate of input.candidates) grouped.set(candidate.key, [...(grouped.get(candidate.key) ?? []), candidate]);
  const facts: Record<string, EpochWorldFact> = {};
  const conflicts: EpochWorldFactMerge["conflicts"] = [];
  const staleKeys: string[] = [];
  const refreshKeys: string[] = [];
  for (const [key, candidates] of grouped) {
    const selected = [...candidates].sort((a, b) => factScore(b, now, staleAfterMs) - factScore(a, now, staleAfterMs))[0] ?? null;
    if (selected) facts[key] = selected;
    const distinctValues = new Set(candidates.map((fact) => canonical(fact.value)));
    if (distinctValues.size > 1) conflicts.push({ key, candidates, selected, reason: "conflicting_sources_resolved_by_confidence_freshness_and_classification" });
    if (selected && Date.parse(selected.observedAt) + staleAfterMs < now) { staleKeys.push(key); refreshKeys.push(key); }
    if (selected && (selected.classification === "UNKNOWN" || selected.confidence < 0.5)) refreshKeys.push(key);
  }
  return { facts, conflicts, staleKeys: [...new Set(staleKeys)], refreshKeys: [...new Set(refreshKeys)] };
}

export function buildEpochWorldRefreshPlan(input: { facts: Record<string, EpochWorldFact>; now?: Date; staleAfterMs?: number }) {
  const merged = mergeEpochWorldFacts({ current: input.facts, candidates: [], now: input.now, staleAfterMs: input.staleAfterMs });
  return { version: "epoch_world_refresh_plan.v1" as const, generatedAt: (input.now ?? new Date()).toISOString(), keys: merged.refreshKeys, reasons: Object.fromEntries(merged.refreshKeys.map((key) => [key, merged.staleKeys.includes(key) ? "stale" : "low_confidence_or_unknown"])) };
}

export type EpochWorldStateComparison = { status: "CURRENT" | "DRIFTED" | "UNKNOWN"; material: boolean; differences: Array<{ key: string; planned: EpochWorldFact | null; current: EpochWorldFact | null; reason: string }>; decision: "PROCEED" | "BLOCK_AND_REDISCOVER" | "REVIEW" };

export function compareEpochWorldStates(input: { planned: EpochWorldModelSnapshot; current: EpochWorldModelSnapshot; materialKeys?: string[] }): EpochWorldStateComparison {
  const keys = new Set([...Object.keys(input.planned.facts), ...Object.keys(input.current.facts)]);
  const materialKeys = new Set(input.materialKeys ?? []);
  const differences: EpochWorldStateComparison["differences"] = [];
  for (const key of keys) {
    const planned = input.planned.facts[key] ?? null;
    const current = input.current.facts[key] ?? null;
    if (!planned || !current) differences.push({ key, planned, current, reason: "fact is missing from one state" });
    else if (canonical(planned.value) !== canonical(current.value)) differences.push({ key, planned, current, reason: "fact value changed" });
    else if (current.classification === "UNKNOWN" || current.confidence < 0.5) differences.push({ key, planned, current, reason: "current fact is not sufficiently known" });
  }
  const material = differences.some((difference) => materialKeys.has(difference.key));
  const uncertain = differences.some((difference) => difference.current?.classification === "UNKNOWN" || (difference.current?.confidence ?? 1) < 0.5);
  return { status: material ? "DRIFTED" : uncertain ? "UNKNOWN" : differences.length ? "DRIFTED" : "CURRENT", material, differences, decision: material ? "BLOCK_AND_REDISCOVER" : uncertain ? "REVIEW" : "PROCEED" };
}
