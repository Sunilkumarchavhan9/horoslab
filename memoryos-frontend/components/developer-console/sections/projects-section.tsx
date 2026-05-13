"use client";

import type { CSSProperties } from "react";

type Workstream = {
  title: string;
  status: string;
  detail: string;
};

type RecentMemory = {
  type: string;
  detail: string;
  confidence: string;
};

type LatestHandoff = {
  title: string;
  detail: string;
  status: string;
};

type RecentRequest = {
  method: string;
  detail: string;
  state: string;
};

type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

function linePoints(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function donutStyle(slices: DonutSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let current = 0;
  const segments: string[] = [];

  for (const slice of slices) {
    const start = (current / total) * 100;
    current += slice.value;
    const end = (current / total) * 100;
    segments.push(`${slice.color} ${start}% ${end}%`);
  }

  return {
    background: `conic-gradient(${segments.join(", ")})`,
  } as CSSProperties;
}

function parsePercent(value: string) {
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function integrationValueToScore(label: string, value: string) {
  const text = `${label} ${value}`.toLowerCase();
  if (text.includes("required") || text.includes("missing") || text.includes("none")) return 40;
  if (text.includes("degraded") || text.includes("partial") || text.includes("pending")) return 58;
  if (text.includes("plugin") || text.includes("mcp")) return 84;
  if (text.includes("api")) return 88;
  if (text.includes("ready") || text.includes("active") || text.includes("healthy") || text.includes("enabled")) return 92;
  return 72;
}

function requestStateToScore(state: string) {
  const normalized = state.toLowerCase();
  if (normalized.includes("success") || normalized.includes("ready")) return 95;
  if (normalized.includes("waiting") || normalized.includes("pending")) return 55;
  if (normalized.includes("error") || normalized.includes("fail")) return 20;
  return 65;
}

function parseConfidence(value: string) {
  const direct = Number(value);
  if (Number.isFinite(direct)) {
    if (direct <= 1) return Math.round(direct * 100);
    return Math.max(0, Math.min(100, Math.round(direct)));
  }
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed <= 1) return Math.round(parsed * 100);
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

type ProjectsSectionProps = {
  activeProjectStatus: string;
  activeProjectName: string;
  activeProjectLastUpdated: string;
  activeProjectUseCase: string;
  activeProjectIntegration: string;
  activeProjectEntry: string;
  currentSummary: string;
  lastKnownState: string;
  nextRecommendedAction: string;
  openLoops: string[];
  activeWorkstreams: Workstream[];
  recentMemories: RecentMemory[];
  latestHandoff: LatestHandoff;
  qualityStatus: Array<[string, string]>;
  integrationHealth: Array<[string, string]>;
  recentRequests: RecentRequest[];
  showSeedFirstMemoryAction: boolean;
  isSeedingFirstMemory: boolean;
  onSeedFirstMemory: () => void | Promise<void>;
};

export function ProjectsSection({
  activeProjectStatus,
  activeProjectName,
  activeProjectLastUpdated,
  activeProjectUseCase,
  activeProjectIntegration,
  activeProjectEntry,
  currentSummary,
  lastKnownState,
  nextRecommendedAction,
  openLoops,
  activeWorkstreams,
  recentMemories,
  latestHandoff,
  qualityStatus,
  integrationHealth,
  recentRequests,
  showSeedFirstMemoryAction,
  isSeedingFirstMemory,
  onSeedFirstMemory,
}: ProjectsSectionProps) {
  const requestBars = recentRequests.map((request, index) => ({
    ...request,
    id: `${request.method}-${index}`,
    score: requestStateToScore(request.state),
  }));
  const requestActivityValues = requestBars.length > 0 ? requestBars.map((request) => request.score) : [0, 0];
  const requestActivityLine = linePoints(requestActivityValues, 320, 90, 10);

  const normalizedStatuses = activeWorkstreams.reduce(
    (acc, workstream) => {
      const status = workstream.status.toLowerCase();
      if (status.includes("ready")) acc.ready += 1;
      else if (status.includes("pending")) acc.pending += 1;
      else acc.active += 1;
      return acc;
    },
    { ready: 0, pending: 0, active: 0 },
  );
  const recentConfidence = recentMemories.map((memory) => parseConfidence(memory.confidence));
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const momentumSeed =
    requestBars.length > 0
      ? requestBars.slice(-5).map((request) => request.score)
      : recentConfidence.slice(0, 5);
  const momentumValues = dayLabels.map((_, index) => momentumSeed[index] ?? 0);
  const projectMomentum = dayLabels.map((label, index) => ({
    label,
    value: momentumValues[index],
  }));
  const momentumLine = linePoints(momentumValues, 520, 170, 18);

  const coverageFromConfidence =
    recentConfidence.length > 0
      ? Math.round(recentConfidence.reduce((sum, value) => sum + value, 0) / recentConfidence.length)
      : 0;
  const memoryFreshness = recentMemories.length > 0 ? Math.min(100, 55 + recentMemories.length * 8) : 0;
  const handoffReadiness =
    latestHandoff.status.toLowerCase().includes("ready") || latestHandoff.status.toLowerCase().includes("generated")
      ? 88
      : recentMemories.length > 0
        ? 52
        : 0;
  const loopClosure = Math.max(0, Math.min(100, 100 - openLoops.length * 20));

  const workstreamSlices: DonutSlice[] = [
    { label: "Ready", value: normalizedStatuses.ready, color: "var(--chart-2)" },
    { label: "Pending", value: normalizedStatuses.pending, color: "var(--chart-5)" },
    { label: "Active", value: normalizedStatuses.active, color: "var(--primary)" },
  ];

  const continuityCoverage = [
    { label: "Context coverage", value: coverageFromConfidence, barClass: "bg-primary" },
    { label: "Memory freshness", value: memoryFreshness, barClass: "bg-chart-2" },
    { label: "Handoff readiness", value: handoffReadiness, barClass: "bg-chart-4" },
    { label: "Loop closure", value: loopClosure, barClass: "bg-chart-5" },
  ];

  const qualityTones = [
    "var(--primary)",
    "var(--chart-4)",
    "var(--chart-2)",
    "var(--chart-5)",
  ];
  const qualityGraphRows = qualityStatus.map(([label, value], index) => {
    const parsed = parsePercent(value);
    const normalized = label.toLowerCase().includes("miss") ? 100 - parsed : parsed;
    return {
      label,
      value,
      normalized: Math.max(0, Math.min(100, normalized)),
      color: qualityTones[index % qualityTones.length],
    };
  });
  const qualityValues = qualityGraphRows.length > 0 ? qualityGraphRows.map((row) => row.normalized) : [0, 0];
  const qualityLine = linePoints(qualityValues, 340, 120, 12);

  const integrationGraphRows = integrationHealth.map(([label, value]) => {
    const score = integrationValueToScore(label, value);
    return { label, value, score };
  });
  const integrationScore =
    integrationGraphRows.length > 0
      ? Math.round(integrationGraphRows.reduce((sum, item) => sum + item.score, 0) / integrationGraphRows.length)
      : 0;
  const integrationSlices: DonutSlice[] = [
    { label: "Healthy", value: integrationScore, color: "var(--chart-2)" },
    { label: "Needs work", value: Math.max(0, 100 - integrationScore), color: "var(--muted)" },
  ];

  const projectSignalRows = [
    {
      label: "Context clarity",
      value: Math.max(40, Math.min(96, Math.round(currentSummary.length * 0.6))),
      color: "var(--primary)",
    },
    {
      label: "State confidence",
      value: Math.max(40, Math.min(96, Math.round(lastKnownState.length * 0.58))),
      color: "var(--chart-2)",
    },
    {
      label: "Action readiness",
      value: Math.max(35, Math.min(98, Math.round(nextRecommendedAction.length * 0.55))),
      color: "var(--chart-4)",
    },
  ];

  const openLoopRows = openLoops.map((loop, index) => {
    const pressure = Math.max(35, 90 - index * 14);
    return { loop, pressure };
  });

  const workstreamRows = activeWorkstreams.map((workstream, index) => {
    const statusScore = requestStateToScore(workstream.status);
    const progress = Math.max(30, Math.min(100, statusScore - index * 6));
    return { ...workstream, progress };
  });

  const memoryConfidenceRows = recentMemories.map((memory, index) => ({
    ...memory,
    id: `${memory.type}-${index}`,
    score: parseConfidence(memory.confidence),
  }));
  const memoryConfidenceValues =
    memoryConfidenceRows.length > 0 ? memoryConfidenceRows.map((memory) => memory.score) : [25, 40, 35];
  const memoryConfidenceLine = linePoints(memoryConfidenceValues, 320, 90, 10);

  const handoffScore = Math.max(25, requestStateToScore(latestHandoff.status));
  const handoffSlices: DonutSlice[] = [
    { label: "Ready", value: handoffScore, color: "var(--primary)" },
    { label: "Pending", value: Math.max(0, 100 - handoffScore), color: "var(--muted)" },
  ];

  const normalizedProjectStatus = activeProjectStatus.toLowerCase();
  const statusTone = normalizedProjectStatus.includes("ready")
    ? {
        border: "border-chart-2/40",
        bg: "bg-chart-2/20",
        text: "text-chart-2",
      }
    : normalizedProjectStatus.includes("pending")
      ? {
          border: "border-chart-5/40",
          bg: "bg-chart-5/20",
          text: "text-chart-5",
        }
      : {
          border: "border-primary/40",
          bg: "bg-primary/20",
          text: "text-primary",
        };

  const primaryPanelClass =
    "rounded-[14px] border border-border bg-card bg-gradient-to-b from-card via-card to-muted/25 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-sm transition duration-300 hover:border-border dark:shadow-black/40";
  const secondaryPanelClass =
    "rounded-[12px] border border-border bg-card/80 bg-gradient-to-b from-card/90 to-muted/20 px-3.5 py-3.5 transition duration-300 hover:border-border";
  const subCardClass =
    "rounded-[10px] border border-border bg-muted/30 px-3 py-3 sm:px-3.5 sm:py-3.5";

  const momentumDelta = (momentumValues[momentumValues.length - 1] ?? 0) - (momentumValues[0] ?? 0);
  const momentumDeltaLabel =
    momentumDelta > 0 ? `+${momentumDelta} points this week` : momentumDelta < 0 ? `${momentumDelta} points this week` : "steady this week";

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-border bg-gradient-to-b from-background via-card/40 to-muted/15 p-4 shadow-lg shadow-black/15 sm:p-5 dark:shadow-black/35">
      <div className="pointer-events-none absolute -left-24 top-[-140px] h-[300px] w-[300px] rounded-full bg-primary/15 blur-[90px]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-130px] h-[290px] w-[290px] rounded-full bg-chart-2/15 blur-[95px]" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.04em] text-foreground sm:text-[24px]">Projects</h1>
          <p className="mt-1.5 max-w-[760px] text-[13px] leading-6 text-muted-foreground sm:text-[14px]">
            Browse active project context, continuity setup, and next actions for your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showSeedFirstMemoryAction ? (
            <button
              type="button"
              onClick={onSeedFirstMemory}
              disabled={isSeedingFirstMemory}
              className="rounded-[10px] border border-primary/45 bg-primary/15 px-3.5 py-2 text-[11px] font-medium tracking-[0.08em] text-primary shadow-md shadow-primary/20 transition duration-300 hover:translate-y-[-1px] hover:border-primary/60 hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSeedingFirstMemory ? "SEEDING..." : "SEED FIRST MEMORY"}
            </button>
          ) : null}
          <div className={`rounded-[10px] border px-3 py-1.5 text-[11px] font-medium tracking-[0.1em] ${statusTone.border} ${statusTone.bg} ${statusTone.text}`}>
            {activeProjectStatus.toUpperCase()}
          </div>
        </div>
      </div>

      <div className={`relative mt-3 border-t-2 border-t-primary ${primaryPanelClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active Project</p>
            <h2 className="mt-2 break-words text-[20px] font-semibold tracking-[-0.04em] text-foreground sm:text-[22px] lg:text-[26px]">
              {activeProjectName}
            </h2>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-muted-foreground sm:text-[14px]">
              MemoryOS uses this project workspace to persist work state, retrieve context, and generate cleaner handoffs
              across developer and agent sessions.
            </p>
          </div>
          <div className="rounded-[10px] border border-border bg-background/25 px-3.5 py-2.5 text-[12px] text-muted-foreground backdrop-blur-sm">
            Last updated {activeProjectLastUpdated.toLowerCase()}
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Status", activeProjectStatus],
            ["Use Case", activeProjectUseCase],
            ["Integration Surface", activeProjectIntegration],
            ["Entry Path", activeProjectEntry],
            ["Project Name", activeProjectName],
            ["Last Updated", activeProjectLastUpdated],
          ].map(([label, value]) => (
            <div key={label} className={subCardClass}>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-1.5 text-[13px] font-semibold tracking-[-0.02em] text-foreground sm:text-[14px]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className={`${primaryPanelClass} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Project Momentum</p>
            <p className="text-[11px] text-primary">{momentumDeltaLabel}</p>
          </div>
          <svg viewBox="0 0 520 170" className="mt-2 h-[170px] w-full">
            <defs>
              <linearGradient id="momentum-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
              </linearGradient>
              <linearGradient id="momentum-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="18" y1="152" x2="502" y2="152" stroke="var(--border)" strokeWidth="1" />
            <line x1="18" y1="18" x2="18" y2="152" stroke="var(--border)" strokeWidth="1" />
            <polyline points={`${momentumLine} 502,152 18,152`} fill="url(#momentum-area-gradient)" stroke="none" />
            <polyline points={momentumLine} fill="none" stroke="url(#momentum-line-gradient)" strokeWidth="3" strokeLinecap="round" />
            {projectMomentum.map((point, index) => {
              const x = 18 + (index / Math.max(projectMomentum.length - 1, 1)) * 484;
              const min = Math.min(...momentumValues);
              const max = Math.max(...momentumValues);
              const range = max - min || 1;
              const y = 152 - ((point.value - min) / range) * 134;
              return (
                <g key={point.label}>
                  <circle cx={x} cy={y} r="3.5" fill="var(--color-primary)" />
                  <circle cx={x} cy={y} r="7.5" fill="var(--color-primary)" fillOpacity="0.18" />
                  <text x={x} y="166" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className={primaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workstream Status Mix</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-[120px] w-[120px] shrink-0 rounded-full shadow-lg shadow-primary/15" style={donutStyle(workstreamSlices)}>
              <div className="absolute inset-[20px] rounded-full bg-card" />
            </div>
            <div className="space-y-2">
              {workstreamSlices.map((slice) => (
                <div key={slice.label} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    <span className="text-muted-foreground">{slice.label}</span>
                  </div>
                  <span className="text-muted-foreground">{slice.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-3 ${primaryPanelClass}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Continuity Coverage</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {continuityCoverage.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${item.barClass} shadow-sm`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Current Summary</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full shadow-sm"
              style={{ width: `${projectSignalRows[0]?.value ?? 0}%`, background: projectSignalRows[0]?.color ?? "var(--primary)" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-[14px]">{currentSummary}</p>
        </div>
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Last Known State</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full shadow-sm"
              style={{ width: `${projectSignalRows[1]?.value ?? 0}%`, background: projectSignalRows[1]?.color ?? "var(--chart-2)" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-[14px]">{lastKnownState}</p>
        </div>
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Next Recommended Action</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full shadow-sm"
              style={{ width: `${projectSignalRows[2]?.value ?? 0}%`, background: projectSignalRows[2]?.color ?? "var(--chart-4)" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-[14px]">{nextRecommendedAction}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Open Loops</p>
          <div className="mt-2.5 space-y-2">
            {openLoopRows.map((row) => (
              <div key={row.loop} className={subCardClass}>
                <p className="text-[12px] leading-6 text-muted-foreground sm:text-[13px]">{row.loop}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-5 shadow-sm" style={{ width: `${row.pressure}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Active Workstreams</p>
          <div className="mt-2.5 space-y-2">
            {workstreamRows.map((workstream) => (
              <div key={workstream.title} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] sm:text-[15px]">{workstream.title}</p>
                  <span className="rounded-[6px] border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {workstream.status}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">{workstream.detail}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary shadow-sm" style={{ width: `${workstream.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent Memories</p>
          <svg viewBox="0 0 320 90" className="mt-2 h-[82px] w-full">
            <defs>
              <linearGradient id="memory-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-chart-2)" />
                <stop offset="100%" stopColor="var(--color-chart-1)" />
              </linearGradient>
            </defs>
            <line x1="10" y1="80" x2="310" y2="80" stroke="var(--border)" strokeWidth="1" />
            <polyline points={memoryConfidenceLine} fill="none" stroke="url(#memory-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="mt-2.5 space-y-2">
            {memoryConfidenceRows.map((memory) => (
              <div key={memory.id} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold tracking-[-0.02em] sm:text-[14px]">{memory.type}</p>
                  <span className="text-[12px] text-muted-foreground">confidence {memory.confidence}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">{memory.detail}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2 shadow-sm" style={{ width: `${memory.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Latest Handoff</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[92px] w-[92px] shrink-0 rounded-full shadow-lg shadow-primary/15" style={donutStyle(handoffSlices)}>
              <div className="absolute inset-[16px] grid place-items-center rounded-full bg-muted text-[13px] font-semibold text-primary">
                {handoffScore}%
              </div>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">handoff trust score</p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{handoffScore}</p>
            </div>
          </div>
          <div className={`mt-2.5 ${subCardClass}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold tracking-[-0.02em] sm:text-[15px]">{latestHandoff.title}</p>
              <span className="rounded-[6px] border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {latestHandoff.status}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">{latestHandoff.detail}</p>
            <button
              type="button"
              className="mt-2.5 rounded-[8px] border border-primary/40 bg-primary/15 px-3.5 py-2 text-[12px] font-medium text-primary transition hover:bg-primary/25"
            >
              Generate first handoff
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quality Status</p>
          <svg viewBox="0 0 340 120" className="mt-2 h-[96px] w-full">
            <defs>
              <linearGradient id="quality-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-chart-4)" />
              </linearGradient>
            </defs>
            <line x1="12" y1="108" x2="328" y2="108" stroke="var(--border)" strokeWidth="1" />
            <polyline points={qualityLine} fill="none" stroke="url(#quality-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
            {qualityValues.map((value, index) => {
              const x = 12 + (index / Math.max(qualityValues.length - 1, 1)) * 316;
              const min = Math.min(...qualityValues);
              const max = Math.max(...qualityValues);
              const range = max - min || 1;
              const y = 108 - ((value - min) / range) * 84;
              return <circle key={`${value}-${index}`} cx={x} cy={y} r="3" fill="var(--color-chart-1)" />;
            })}
          </svg>
          <div className="mt-1.5 space-y-2">
            {qualityGraphRows.map((row) => (
              <div key={row.label} className={subCardClass}>
                <div className="flex items-center justify-between gap-3 text-[12px] sm:text-[13px]">
                  <p className="text-muted-foreground">{row.label}</p>
                  <p className="font-semibold">{row.value}</p>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full shadow-sm" style={{ width: `${row.normalized}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Integration Health</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[92px] w-[92px] shrink-0 rounded-full shadow-lg shadow-chart-2/15" style={donutStyle(integrationSlices)}>
              <div className="absolute inset-[16px] grid place-items-center rounded-full bg-muted text-[13px] font-semibold text-chart-2">
                {integrationScore}%
              </div>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">Overall health score</p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{integrationScore}</p>
            </div>
          </div>
          <div className="mt-2.5 space-y-2">
            {integrationGraphRows.map((row) => (
              <div key={row.label} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] text-muted-foreground sm:text-[13px]">{row.label}</p>
                  <p className="text-[12px] font-semibold sm:text-[13px]">{row.value}</p>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2 shadow-sm" style={{ width: `${row.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent Requests</p>
          <svg viewBox="0 0 320 90" className="mt-2 h-[82px] w-full">
            <defs>
              <linearGradient id="request-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-chart-4)" />
                <stop offset="100%" stopColor="var(--color-chart-1)" />
              </linearGradient>
            </defs>
            <line x1="10" y1="80" x2="310" y2="80" stroke="var(--border)" strokeWidth="1" />
            <polyline points={requestActivityLine} fill="none" stroke="url(#request-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="mt-1.5 space-y-2">
            {requestBars.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-border bg-muted/40 px-3 py-3 text-[12px] text-muted-foreground">
                No request activity yet. Run retrieve/resume from Playground.
              </div>
            ) : (
              requestBars.map((request) => (
                <div key={request.id} className={subCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold tracking-[-0.02em] sm:text-[14px]">{request.method}</p>
                    <span className="rounded-[6px] border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {request.state}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">{request.detail}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-4 shadow-sm" style={{ width: `${request.score}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
