import { getCompanyBrainKpis } from "./kpis";
import { getMasterplanLoopStats } from "../masterplan/productLoopStore";
import {
  getGraph,
  listActions,
  listAlerts,
  listAudit,
  listSources,
  listWorkers,
} from "./platform";

export type MasterplanDashboardMetric = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  status: "live" | "waiting" | "warning" | "blocked";
  detail: string;
};

export type MasterplanDashboardStage = {
  id: string;
  title: string;
  status: "live" | "waiting" | "warning" | "blocked";
  score: number;
  timestamp: string | null;
  proof: string;
  nextAction: string;
};

export type MasterplanDashboardProofEvent = {
  id: string;
  type: string;
  title: string;
  status: "live" | "waiting" | "warning" | "blocked";
  timestamp: string;
  proof: string;
};

export type MasterplanDashboardSnapshot = {
  generatedAt: string;
  workspace: {
    id: string | null;
    name: string;
    status: "live";
  };
  headline: {
    title: string;
    subtitle: string;
    proofChain: string;
  };
  metrics: MasterplanDashboardMetric[];
  stages: MasterplanDashboardStage[];
  proofEvents: MasterplanDashboardProofEvent[];
  rightPanel: {
    selectedProof: string;
    riskSummary: string;
    recommendedNextAction: string;
    learningSummary: string;
  };
};

type BuildMasterplanDashboardInput = {
  userId: string;
  orgId?: string;
};

function statusFromCount(count: number): "live" | "waiting" {
  return count > 0 ? "live" : "waiting";
}

function statusFromRisk(count: number): "live" | "waiting" | "warning" {
  if (count > 0) return "warning";
  return "live";
}

function percent(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function timestampFromItem(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const candidates = [
    record.updatedAt,
    record.createdAt,
    record.timestamp,
    record.lastHeartbeat,
    record.lastSyncAt,
  ];
  const found = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.length > 0,
  );
  return typeof found === "string" ? found : null;
}

function latestTimestamp(items: unknown[]): string | null {
  const timestamps = items
    .map(timestampFromItem)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left));
  return timestamps[0] ?? null;
}

function proofEventFromAudit(
  event: unknown,
  index: number,
): MasterplanDashboardProofEvent {
  const record =
    event && typeof event === "object"
      ? (event as Record<string, unknown>)
      : {};
  const type =
    typeof record.type === "string"
      ? record.type
      : typeof record.event === "string"
        ? record.event
        : "audit_event";
  const title =
    typeof record.message === "string"
      ? record.message
      : type.replace(/_/g, " ");
  return {
    id: typeof record.id === "string" ? record.id : `audit-${index}`,
    type,
    title,
    status: "live",
    timestamp: timestampFromItem(record) ?? new Date().toISOString(),
    proof: typeof record.proof === "string" ? record.proof : "audit_log",
  };
}

export async function buildMasterplanDashboardSnapshot(
  input: BuildMasterplanDashboardInput,
): Promise<MasterplanDashboardSnapshot> {
  const generatedAt = new Date().toISOString();
  const [kpis, loopsGraph, canonical] = await Promise.all([
    getCompanyBrainKpis({ userId: input.userId, orgId: input.orgId }),
    getGraph(input.userId),
    getMasterplanLoopStats({ userId: input.userId, orgId: input.orgId }),
  ]);

  const [sources, actions, audit, alerts, workers] = await Promise.all([
    listSources(input.userId),
    listActions(input.userId),
    listAudit(input.userId),
    listAlerts(input.userId),
    listWorkers(input.userId),
  ]);

  const sourceCount = Math.max(sources.length, canonical.sources);
  const memoryCount = Math.max(kpis.memory.recentCount, canonical.memories);
  const graphNodeCount = Math.max(
    loopsGraph.nodes.length,
    canonical.blueprints + canonical.agentRuns,
  );
  const pendingApprovals = kpis.execution.pendingApprovals;
  const executedRuns = kpis.execution.allTime.executed;
  const failedRuns = kpis.execution.allTime.failed;
  const outcomeCount = Math.max(executedRuns + failedRuns, canonical.outcomes);
  const riskEvents = alerts.length + pendingApprovals + failedRuns;
  const activeWorkers = workers.filter((worker) => {
    const status = (worker as Record<string, unknown>).status;
    return status === "running" || status === "idle";
  }).length;
  const reliabilityScore = percent(
    kpis.execution.approvalToSuccessRatePercent,
    outcomeCount > 0 ? 50 : 0,
  );
  const memoryQualityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((memoryCount > 0 ? 70 : 20) + Math.min(memoryCount, 30)),
    ),
  );
  const readinessScore = Math.round(
    ([
      sourceCount > 0,
      memoryCount > 0,
      graphNodeCount > 0,
      pendingApprovals === 0,
      outcomeCount > 0,
      activeWorkers > 0,
    ].filter(Boolean).length /
      6) *
      100,
  );

  const stages: MasterplanDashboardStage[] = [
    {
      id: "source-ingestion",
      title: "Company Sources",
      status: statusFromCount(sourceCount),
      score: sourceCount > 0 ? 100 : 0,
      timestamp: latestTimestamp(sources),
      proof: sourceCount > 0 ? "source_registry" : "waiting_for_source",
      nextAction:
        sourceCount > 0
          ? "Sync sources and extract memories."
          : "Connect GitHub, docs, or agent chat paste.",
    },
    {
      id: "memory-extraction",
      title: "Trusted Memory",
      status: statusFromCount(memoryCount),
      score: memoryQualityScore,
      timestamp: kpis.generatedAt,
      proof:
        memoryCount > 0
          ? "recent_memory_store"
          : "waiting_for_memory_extraction",
      nextAction:
        memoryCount > 0
          ? "Run Knowledge Integrity checks."
          : "Import source items to create structured memories.",
    },
    {
      id: "work-graph",
      title: "Work Graph",
      status: statusFromCount(graphNodeCount),
      score: graphNodeCount > 0 ? Math.min(100, 45 + graphNodeCount * 5) : 0,
      timestamp: loopsGraph.updatedAt,
      proof: graphNodeCount > 0 ? "company_memory_graph" : "waiting_for_graph",
      nextAction:
        graphNodeCount > 0
          ? "Link memories to workflows and agent roles."
          : "Rebuild graph after memory extraction.",
    },
    {
      id: "governance",
      title: "Policy + Risk",
      status: statusFromRisk(riskEvents),
      score: Math.max(0, 100 - riskEvents * 10),
      timestamp: latestTimestamp(alerts) ?? kpis.generatedAt,
      proof:
        riskEvents > 0 ? "risk_alerts_and_approvals" : "policy_check_clean",
      nextAction:
        riskEvents > 0
          ? "Review pending approvals and risk warnings."
          : "Keep policy checks enabled before Send Now.",
    },
    {
      id: "execution",
      title: "Agent Runs",
      status: statusFromCount(outcomeCount),
      score: reliabilityScore,
      timestamp: latestTimestamp(actions) ?? kpis.generatedAt,
      proof: outcomeCount > 0 ? "execution_outcomes" : "waiting_for_agent_run",
      nextAction:
        outcomeCount > 0
          ? "Capture outcome and compile learning."
          : "Create a MemoryIgnition package and Send Now.",
    },
    {
      id: "learning",
      title: "Outcome Learning",
      status: statusFromCount(outcomeCount),
      score: outcomeCount > 0 ? reliabilityScore : 0,
      timestamp: latestTimestamp(audit) ?? kpis.generatedAt,
      proof: outcomeCount > 0 ? "outcome_learning_loop" : "waiting_for_outcome",
      nextAction:
        outcomeCount > 0
          ? "Approve future-agent instructions and skill candidates."
          : "Require an outcome after every agent run.",
    },
  ];

  const proofEvents = audit.slice(0, 8).map(proofEventFromAudit);
  if (proofEvents.length === 0) {
    proofEvents.push(
      ...stages.slice(0, 4).map(
        (stage) =>
          ({
            id: `stage-${stage.id}`,
            type: stage.id,
            title: stage.title,
            status: stage.status,
            timestamp: stage.timestamp ?? generatedAt,
            proof: stage.proof,
          }) satisfies MasterplanDashboardProofEvent,
      ),
    );
  }

  return {
    generatedAt,
    workspace: {
      id: kpis.orgId,
      name: kpis.orgId ? `Workspace ${kpis.orgId}` : "Personal workspace",
      status: "live",
    },
    headline: {
      title: "Agent Workforce Operating Infrastructure",
      subtitle:
        "Company memory, governed execution, proof, outcomes, and future-agent learning in one realtime control plane.",
      proofChain:
        "Source → Memory → Package → Agent Run → Outcome → Future Instruction",
    },
    metrics: [
      {
        id: "agents-prepared",
        label: "Agents Prepared",
        value: Math.max(kpis.continuity.totalThreads, canonical.agentRuns),
        status: statusFromCount(
          Math.max(kpis.continuity.totalThreads, canonical.agentRuns),
        ),
        detail: "AgentRun records and prepared agent contexts.",
      },
      {
        id: "packages-generated",
        label: "Packages Generated",
        value: Math.max(kpis.continuity.activeThreads, canonical.packages),
        status: statusFromCount(
          Math.max(kpis.continuity.activeThreads, canonical.packages),
        ),
        detail: "Universal Agent Inheritance Packages generated.",
      },
      {
        id: "agent-runs",
        label: "Agent Runs",
        value: canonical.agentRuns,
        status: statusFromCount(canonical.agentRuns),
        detail:
          "Canonical AgentRun records requiring timeline and outcome proof.",
      },
      {
        id: "outcomes-captured",
        label: "Outcomes Captured",
        value: canonical.outcomes,
        status: statusFromCount(canonical.outcomes),
        detail: "Canonical Outcome records captured from agent runs.",
      },
      {
        id: "risks-detected",
        label: "Risks Detected",
        value: riskEvents,
        status: riskEvents > 0 ? "warning" : "live",
        detail: "Alerts, failed runs, and pending approvals.",
      },
      {
        id: "memory-quality",
        label: "Memory Quality",
        value: memoryQualityScore,
        unit: "%",
        status: memoryQualityScore >= 70 ? "live" : "warning",
        detail: "Derived from available structured memory signals.",
      },
      {
        id: "agent-reliability",
        label: "Agent Reliability",
        value: reliabilityScore,
        unit: "%",
        status:
          reliabilityScore >= 70
            ? "live"
            : outcomeCount > 0
              ? "warning"
              : "waiting",
        detail: "Executed vs failed terminal execution outcomes.",
      },
      {
        id: "readiness",
        label: "Readiness",
        value: readinessScore,
        unit: "%",
        status: readinessScore >= 70 ? "live" : "warning",
        detail:
          "Masterplan loop readiness across source, memory, graph, policy, run, and learning.",
      },
    ],
    stages,
    proofEvents,
    rightPanel: {
      selectedProof: proofEvents[0]?.proof ?? "waiting_for_proof",
      riskSummary:
        riskEvents > 0
          ? `${riskEvents} governance signals need review.`
          : "No active risk warnings in the current snapshot.",
      recommendedNextAction:
        stages.find((stage) => stage.status !== "live")?.nextAction ??
        "Prepare the next agent and require an outcome report.",
      learningSummary:
        outcomeCount > 0
          ? `${canonical.futureInstructions} future-agent instruction candidate(s) are available to review.`
          : "Capture the first outcome to start future-agent learning.",
    },
  };
}
