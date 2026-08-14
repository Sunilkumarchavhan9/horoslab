import {
  listAgentRuns,
  listAgentSkills,
  listFutureInstructions,
  listInheritancePackages,
  listMemories,
  listOutcomes,
  listPolicies,
  listSourceItems,
  listSources,
  listWorkspaces,
  type MasterplanScope,
} from "../masterplan/productLoopStore";

type RangeKey = "7d" | "30d" | "90d";

type JsonRecord = Record<string, unknown>;

function parseRange(range?: string): { key: RangeKey; days: number } {
  if (range === "30d") return { key: "30d", days: 30 };
  if (range === "90d") return { key: "90d", days: 90 };
  return { key: "7d", days: 7 };
}

function rangeStart(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildBuckets(days: number): Array<{ key: string; label: string }> {
  const start = rangeStart(days);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: dayKey(date),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

function percentage(numerator: number, denominator: number, fallback = 0): number {
  if (denominator <= 0) return fallback;
  return Math.round((numerator / denominator) * 100);
}

function average(values: number[], fallback = 0): number {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return fallback;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function riskFromText(...values: unknown[]): "High" | "Medium" | "Low" {
  const text = values.map((value) => String(value ?? "")).join(" ").toLowerCase();
  if (/high|auth|billing|secret|token|production|database|migration|security/.test(text)) return "High";
  if (/medium|approval|risk|test|stale|conflict/.test(text)) return "Medium";
  return "Low";
}

function trend(current: number, previous: number): { value: number; direction: "up" | "down" | "flat" } {
  if (previous === 0 && current === 0) return { value: 0, direction: "flat" };
  if (previous === 0) return { value: current, direction: "up" };
  const delta = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(delta),
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

async function overviewData(scope: MasterplanScope) {
  const [
    workspaces,
    sources,
    sourceItems,
    memories,
    packages,
    runs,
    outcomes,
    futureInstructions,
    policies,
    skills,
  ] = await Promise.all([
    listWorkspaces(scope),
    listSources(scope),
    listSourceItems(scope),
    listMemories(scope, {}),
    listInheritancePackages(scope),
    listAgentRuns(scope),
    listOutcomes(scope),
    listFutureInstructions(scope),
    listPolicies(scope),
    listAgentSkills(scope),
  ]);

  return {
    workspaces,
    sources,
    sourceItems,
    memories,
    packages,
    runs,
    outcomes,
    futureInstructions,
    policies,
    skills,
  };
}

export async function getOverviewSummary(scope: MasterplanScope) {
  const data = await overviewData(scope);
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recent = (date: Date | null | undefined) => date ? now - date.getTime() <= sevenDaysMs : false;
  const recentRuns = data.runs.filter((run) => recent(run.startedAt));
  const previousRuns = data.runs.filter((run) => run.startedAt && now - run.startedAt.getTime() > sevenDaysMs && now - run.startedAt.getTime() <= sevenDaysMs * 2);
  const recentPackages = data.packages.filter((item) => recent(item.createdAt));
  const previousPackages = data.packages.filter((item) => now - item.createdAt.getTime() > sevenDaysMs && now - item.createdAt.getTime() <= sevenDaysMs * 2);
  const recentOutcomes = data.outcomes.filter((item) => recent(item.createdAt));
  const previousOutcomes = data.outcomes.filter((item) => now - item.createdAt.getTime() > sevenDaysMs && now - item.createdAt.getTime() <= sevenDaysMs * 2);
  const activeFutureInstructions = data.futureInstructions.filter((item) => item.status === "active" || item.status === "approved");
  const candidateFutureInstructions = data.futureInstructions.filter((item) => item.status === "candidate" || item.status === "needs_review");
  const completedRuns = data.runs.filter((run) => run.status === "Completed" || Boolean(run.outcomeId));
  const memoryQuality = average(data.memories.map((memory) => memory.qualityScore), data.memories.length ? 70 : 0);
  const readiness = average(data.packages.map((item) => item.agentReadinessScore), data.packages.length ? 70 : 0);
  const outcomeCoverage = percentage(data.outcomes.length, data.runs.length, data.runs.length ? 0 : 100);
  const inheritanceHealth = average([memoryQuality, readiness, outcomeCoverage], 0);

  return {
    generatedAt: new Date().toISOString(),
    workspaceCount: data.workspaces.length,
    proofChain: "Source -> Memory -> Package -> Agent Run -> Outcome -> Future Instruction",
    metrics: [
      {
        id: "inheritance_health",
        label: "Inheritance Health",
        value: inheritanceHealth,
        unit: "%",
        detail: `${data.packages.length} packages, ${data.runs.length} runs, ${data.outcomes.length} outcomes`,
        trend: trend(recentPackages.length + recentOutcomes.length, previousPackages.length + previousOutcomes.length),
        target: { page: "MemoryIgnition", filter: "ready" },
      },
      {
        id: "memory_quality",
        label: "Memory Quality",
        value: memoryQuality,
        unit: "%",
        detail: `${data.memories.length} structured memories from ${data.sources.length} sources`,
        trend: trend(data.memories.filter((item) => recent(item.createdAt)).length, 0),
        target: { page: "Company Brain", filter: "quality" },
      },
      {
        id: "agent_readiness",
        label: "Agent Readiness",
        value: readiness,
        unit: "%",
        detail: `${completedRuns.length}/${data.runs.length} runs have completion proof`,
        trend: trend(recentRuns.length, previousRuns.length),
        target: { page: "Agent Runs", filter: "recent" },
      },
      {
        id: "mistakes_avoided",
        label: "Mistakes Avoided",
        value: activeFutureInstructions.length + data.policies.filter((item) => item.status === "active").length,
        unit: "",
        detail: `${candidateFutureInstructions.length} rules or instructions need review`,
        trend: trend(recentOutcomes.length, previousOutcomes.length),
        target: { page: "Mistake Immunity", filter: "active" },
      },
    ],
    counts: {
      sources: data.sources.length,
      memories: data.memories.length,
      packages: data.packages.length,
      agentRuns: data.runs.length,
      outcomes: data.outcomes.length,
      futureInstructions: data.futureInstructions.length,
      activeSkills: data.skills.filter((skill) => skill.status === "active" || skill.status === "approved").length,
    },
    loop: [
      { id: "source", label: "Source", count: data.sources.length, status: data.sources.length ? "active" : "empty" },
      { id: "memory", label: "Memory", count: data.memories.length, status: data.memories.length ? "active" : "empty" },
      { id: "package", label: "Package", count: data.packages.length, status: data.packages.length ? "active" : "empty" },
      { id: "agent_run", label: "Agent Run", count: data.runs.length, status: data.runs.length ? "active" : "empty" },
      { id: "outcome", label: "Outcome", count: data.outcomes.length, status: data.outcomes.length ? "active" : "needs_work" },
      { id: "future_instruction", label: "Future Instruction", count: data.futureInstructions.length, status: data.futureInstructions.length ? "active" : "needs_work" },
      { id: "mistake_immunity", label: "Mistake Immunity", count: activeFutureInstructions.length, status: activeFutureInstructions.length ? "active" : "needs_work" },
      { id: "skill", label: "Skill", count: data.skills.length, status: data.skills.length ? "active" : "needs_work" },
    ],
  };
}

export async function getOverviewAttention(scope: MasterplanScope) {
  const data = await overviewData(scope);
  const missingOutcome = data.runs
    .filter((run) => !run.outcomeId && run.status !== "Completed")
    .slice(0, 6)
    .map((run) => ({
      id: `run:${run.id}`,
      type: "agent_run",
      title: "Agent run is missing outcome learning",
      description: run.inheritancePackage?.task ?? `Run ${run.id} needs outcome proof.`,
      severity: riskFromText(run.inheritancePackage?.task, run.status),
      action: "Resolve",
      proof: { runId: run.id, packageId: run.packageId, events: run.events.length },
      target: { page: "Agent Runs", id: run.id },
    }));
  const futureInstructionReview = data.futureInstructions
    .filter((item) => item.status === "candidate" || item.status === "needs_review")
    .slice(0, 6)
    .map((item) => ({
      id: `future:${item.id}`,
      type: "future_instruction",
      title: "Future instruction needs approval",
      description: item.instruction,
      severity: riskFromText(item.riskLevel, item.instruction),
      action: "Approve",
      proof: item.proof,
      target: { page: "Future Instructions", id: item.id },
    }));
  const memoryReview = data.memories
    .filter((memory) => memory.status !== "approved" || memory.qualityScore < 70 || memory.riskLevel === "high")
    .slice(0, 6)
    .map((memory) => ({
      id: `memory:${memory.id}`,
      type: "memory",
      title: memory.qualityScore < 70 ? "Low-confidence memory needs review" : "Risk memory needs review",
      description: memory.summary || memory.title,
      severity: riskFromText(memory.riskLevel, memory.summary),
      action: "Review",
      proof: memory.proof,
      target: { page: "Company Brain", id: memory.id },
    }));

  return {
    generatedAt: new Date().toISOString(),
    rows: [...missingOutcome, ...futureInstructionReview, ...memoryReview].slice(0, 12),
  };
}

export async function getOverviewMistakeImmunity(scope: MasterplanScope) {
  const data = await overviewData(scope);
  const fromFutureInstructions = data.futureInstructions.map((item) => {
    const trigger = asRecord(item.triggerContext);
    return {
      id: item.id,
      title: item.instruction.slice(0, 96),
      mistakePattern: String(trigger.problem ?? trigger.mistake ?? trigger.task ?? "Outcome-created prevention rule"),
      preventionInstruction: item.instruction,
      requiredTests: asArray(item.requiredTests).map(String),
      riskyFiles: asArray(item.affectedFiles).map(String),
      approvalRequired: item.riskLevel === "high",
      status: item.status,
      riskLevel: riskFromText(item.riskLevel, item.instruction),
      proof: item.proof,
      createdAt: item.createdAt.toISOString(),
      source: "FutureAgentInstruction",
    };
  });
  const fromRiskMemories = data.memories
    .filter((memory) => memory.type === "mistake_pattern" || memory.type === "risky_file" || /mistake|avoid|failed|correction/i.test(`${memory.summary} ${memory.content}`))
    .map((memory) => ({
      id: memory.id,
      title: memory.title || memory.summary.slice(0, 96),
      mistakePattern: memory.summary || "Known repeated mistake",
      preventionInstruction: memory.content || memory.summary,
      requiredTests: asArray(memory.relatedTests).map(String),
      riskyFiles: asArray(memory.relatedFiles).map(String),
      approvalRequired: memory.riskLevel === "high",
      status: memory.status,
      riskLevel: riskFromText(memory.riskLevel, memory.summary),
      proof: memory.proof,
      createdAt: memory.createdAt.toISOString(),
      source: "Memory",
    }));

  return {
    generatedAt: new Date().toISOString(),
    rows: [...fromFutureInstructions, ...fromRiskMemories].slice(0, 20),
  };
}

export async function getOverviewInheritancePerformance(scope: MasterplanScope, range?: string) {
  const parsed = parseRange(range);
  const data = await overviewData(scope);
  const buckets = buildBuckets(parsed.days);
  const byDay = new Map(buckets.map((bucket) => [bucket.key, { name: bucket.label, packages: 0, runs: 0, outcomes: 0, futureInstructions: 0 }]));
  for (const item of data.packages) {
    const bucket = byDay.get(dayKey(item.createdAt));
    if (bucket) bucket.packages++;
  }
  for (const item of data.runs) {
    if (!item.startedAt) continue;
    const bucket = byDay.get(dayKey(item.startedAt));
    if (bucket) bucket.runs++;
  }
  for (const item of data.outcomes) {
    const bucket = byDay.get(dayKey(item.createdAt));
    if (bucket) bucket.outcomes++;
  }
  for (const item of data.futureInstructions) {
    const bucket = byDay.get(dayKey(item.createdAt));
    if (bucket) bucket.futureInstructions++;
  }

  return {
    range: parsed.key,
    generatedAt: new Date().toISOString(),
    points: Array.from(byDay.values()),
  };
}

export async function getOverviewOutcomeLearning(scope: MasterplanScope, range?: string) {
  const parsed = parseRange(range);
  const data = await overviewData(scope);
  const buckets = buildBuckets(parsed.days);
  const byDay = new Map(buckets.map((bucket) => [bucket.key, { name: bucket.label, learningRate: 0, outcomes: 0, futureInstructions: 0, mistakesAvoided: 0 }]));
  for (const item of data.outcomes) byDay.get(dayKey(item.createdAt))!.outcomes++;
  for (const item of data.futureInstructions) {
    const bucket = byDay.get(dayKey(item.createdAt));
    if (bucket) {
      bucket.futureInstructions++;
      if (item.status === "active" || item.status === "approved") bucket.mistakesAvoided++;
    }
  }
  for (const bucket of byDay.values()) {
    bucket.learningRate = percentage(bucket.futureInstructions, Math.max(bucket.outcomes, 1), bucket.outcomes ? 0 : 0);
  }
  const totalOutcomes = Array.from(byDay.values()).reduce((sum, bucket) => sum + bucket.outcomes, 0);
  const totalFutureInstructions = Array.from(byDay.values()).reduce((sum, bucket) => sum + bucket.futureInstructions, 0);

  return {
    range: parsed.key,
    generatedAt: new Date().toISOString(),
    learningRate: percentage(totalFutureInstructions, Math.max(totalOutcomes, 1), totalOutcomes ? 0 : 0),
    proofChain: "Source -> Memory -> Package -> Agent Run -> Outcome -> Future Instruction",
    points: Array.from(byDay.values()),
  };
}

export async function getOverviewSources(scope: MasterplanScope) {
  const data = await overviewData(scope);
  return {
    generatedAt: new Date().toISOString(),
    rows: data.sources.map((source) => {
      const items = data.sourceItems.filter((item) => item.sourceId === source.id);
      const itemIds = new Set(items.map((item) => item.id));
      const memories = data.memories.filter((memory) => memory.sourceItemId && itemIds.has(memory.sourceItemId));
      return {
        id: source.id,
        provider: source.provider,
        type: source.type,
        status: source.status,
        itemCount: items.length,
        memoryCount: memories.length,
        qualityScore: average(memories.map((memory) => memory.qualityScore), memories.length ? 70 : 0),
        lastSyncedAt: source.lastSyncedAt?.toISOString() ?? null,
        createdAt: source.createdAt.toISOString(),
        target: { page: "Company Sources", id: source.id },
      };
    }),
  };
}

export async function getOverviewRecentAgentRuns(scope: MasterplanScope) {
  const data = await overviewData(scope);
  return {
    generatedAt: new Date().toISOString(),
    rows: data.runs.slice(0, 12).map((run) => {
      const payloads = run.events.map((event) => asRecord(event.payload));
      const memoryUsed = payloads.reduce((count, payload) => {
        const companyMemory = asArray(payload.company_memory);
        return Math.max(count, companyMemory.length);
      }, 0);
      const tests = payloads.flatMap((payload) => asArray(payload.required_tests).map(String));
      return {
        id: run.id,
        agent: run.targetAgent,
        task: run.inheritancePackage?.task ?? "Direct agent run",
        status: run.status,
        risk: riskFromText(run.inheritancePackage?.task, run.events.map((event) => event.type).join(" ")),
        memoryUsed,
        tests: tests.length ? `${tests.length} recommended` : "No tests",
        outcome: run.outcomeId ? "Saved" : run.status === "Completed" ? "Completed" : "Needed",
        packageId: run.packageId,
        startedAt: run.startedAt?.toISOString() ?? null,
        eventCount: run.events.length,
        target: { page: "Agent Runs", id: run.id },
      };
    }),
  };
}
