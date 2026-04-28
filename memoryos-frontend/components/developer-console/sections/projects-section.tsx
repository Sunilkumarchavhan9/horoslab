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
    { label: "Ready", value: normalizedStatuses.ready, color: "#14c38e" },
    { label: "Pending", value: normalizedStatuses.pending, color: "#f0b429" },
    { label: "Active", value: normalizedStatuses.active, color: "#4f93ff" },
  ];

  const continuityCoverage = [
    { label: "Context coverage", value: coverageFromConfidence, tone: "bg-[#4f93ff]" },
    { label: "Memory freshness", value: memoryFreshness, tone: "bg-[#14c38e]" },
    { label: "Handoff readiness", value: handoffReadiness, tone: "bg-[#9b7bff]" },
    { label: "Loop closure", value: loopClosure, tone: "bg-[#f0b429]" },
  ];

  const qualityTones = ["#4f93ff", "#9b7bff", "#14c38e", "#f0b429"];
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
    { label: "Healthy", value: integrationScore, color: "#14c38e" },
    { label: "Needs work", value: Math.max(0, 100 - integrationScore), color: "#272727" },
  ];

  const projectSignalRows = [
    {
      label: "Context clarity",
      value: Math.max(40, Math.min(96, Math.round(currentSummary.length * 0.6))),
      color: "#4f93ff",
    },
    {
      label: "State confidence",
      value: Math.max(40, Math.min(96, Math.round(lastKnownState.length * 0.58))),
      color: "#14c38e",
    },
    {
      label: "Action readiness",
      value: Math.max(35, Math.min(98, Math.round(nextRecommendedAction.length * 0.55))),
      color: "#9b7bff",
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
    { label: "Ready", value: handoffScore, color: "#4f93ff" },
    { label: "Pending", value: Math.max(0, 100 - handoffScore), color: "#272727" },
  ];

  const normalizedProjectStatus = activeProjectStatus.toLowerCase();
  const statusTone = normalizedProjectStatus.includes("ready")
    ? {
        border: "border-[#14c38e]/40",
        bg: "bg-[#0d2f23]/70",
        text: "text-[#7fe8bf]",
      }
    : normalizedProjectStatus.includes("pending")
      ? {
          border: "border-[#f0b429]/40",
          bg: "bg-[#33270f]/70",
          text: "text-[#ffd27b]",
        }
      : {
          border: "border-[#4f93ff]/40",
          bg: "bg-[#102145]/70",
          text: "text-[#9bc1ff]",
        };

  const primaryPanelClass =
    "rounded-[14px] border border-white/[0.09] bg-[radial-gradient(120%_120%_at_0%_0%,rgba(79,147,255,0.10),transparent_48%),linear-gradient(180deg,#171a22_0%,#10131b_100%)] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition duration-300 hover:border-white/15";
  const secondaryPanelClass =
    "rounded-[12px] border border-white/[0.08] bg-[linear-gradient(180deg,#121621_0%,#0d1018_100%)] px-3.5 py-3.5 transition duration-300 hover:border-white/14";
  const subCardClass =
    "rounded-[10px] border border-white/[0.09] bg-[linear-gradient(180deg,#0f131d_0%,#0a0d14_100%)] px-3 py-3 sm:px-3.5 sm:py-3.5";

  const momentumDelta = (momentumValues[momentumValues.length - 1] ?? 0) - (momentumValues[0] ?? 0);
  const momentumDeltaLabel =
    momentumDelta > 0 ? `+${momentumDelta} points this week` : momentumDelta < 0 ? `${momentumDelta} points this week` : "steady this week";

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-white/[0.08] bg-[linear-gradient(180deg,#0b0f17_0%,#070a10_100%)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-5">
      <div className="pointer-events-none absolute -left-24 top-[-140px] h-[300px] w-[300px] rounded-full bg-[#4f93ff]/15 blur-[90px]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-130px] h-[290px] w-[290px] rounded-full bg-[#14c38e]/12 blur-[95px]" />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[24px]">Projects</h1>
          <p className="mt-1.5 max-w-[760px] text-[13px] leading-6 text-white/58 sm:text-[14px]">
            Browse active project context, continuity setup, and next actions for your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showSeedFirstMemoryAction ? (
            <button
              type="button"
              onClick={onSeedFirstMemory}
              disabled={isSeedingFirstMemory}
              className="rounded-[10px] border border-[#4f93ff]/45 bg-[linear-gradient(180deg,#193360_0%,#13294f_100%)] px-3.5 py-2 text-[11px] font-medium tracking-[0.08em] text-[#bed7ff] shadow-[0_6px_18px_rgba(79,147,255,0.28)] transition duration-300 hover:translate-y-[-1px] hover:border-[#79b2ff]/60 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSeedingFirstMemory ? "SEEDING..." : "SEED FIRST MEMORY"}
            </button>
          ) : null}
          <div className={`rounded-[10px] border px-3 py-1.5 text-[11px] font-medium tracking-[0.1em] ${statusTone.border} ${statusTone.bg} ${statusTone.text}`}>
            {activeProjectStatus.toUpperCase()}
          </div>
        </div>
      </div>

      <div className={`relative mt-3 ${primaryPanelClass}`} style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Active Project</p>
            <h2 className="mt-2 break-words text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[22px] lg:text-[26px]">
              {activeProjectName}
            </h2>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-white/60 sm:text-[14px]">
              MemoryOS uses this project workspace to persist work state, retrieve context, and generate cleaner handoffs
              across developer and agent sessions.
            </p>
          </div>
          <div className="rounded-[10px] border border-white/12 bg-black/25 px-3.5 py-2.5 text-[12px] text-white/66 backdrop-blur-sm">
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
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">{label}</p>
              <p className="mt-1.5 text-[13px] font-semibold tracking-[-0.02em] text-white sm:text-[14px]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className={`${primaryPanelClass} xl:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Project Momentum</p>
            <p className="text-[11px] text-[#8bb5ff]">{momentumDeltaLabel}</p>
          </div>
          <svg viewBox="0 0 520 170" className="mt-2 h-[170px] w-full">
            <defs>
              <linearGradient id="momentum-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f93ff" />
                <stop offset="100%" stopColor="#7ac2ff" />
              </linearGradient>
              <linearGradient id="momentum-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4f93ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4f93ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="18" y1="152" x2="502" y2="152" stroke="#252525" strokeWidth="1" />
            <line x1="18" y1="18" x2="18" y2="152" stroke="#252525" strokeWidth="1" />
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
                  <circle cx={x} cy={y} r="3.5" fill="#b1d2ff" />
                  <circle cx={x} cy={y} r="7.5" fill="#4f93ff" fillOpacity="0.18" />
                  <text x={x} y="166" textAnchor="middle" fill="#6f8bb5" fontSize="10">
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className={primaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Workstream Status Mix</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-[120px] w-[120px] shrink-0 rounded-full shadow-[0_0_30px_rgba(79,147,255,0.2)]" style={donutStyle(workstreamSlices)}>
              <div className="absolute inset-[20px] rounded-full bg-[#0f1219]" />
            </div>
            <div className="space-y-2">
              {workstreamSlices.map((slice) => (
                <div key={slice.label} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    <span className="text-white/74">{slice.label}</span>
                  </div>
                  <span className="text-white/52">{slice.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-3 ${primaryPanelClass}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Continuity Coverage</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {continuityCoverage.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-white/78">{item.label}</span>
                <span className="text-white/46">{item.value}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                <div className={`h-full ${item.tone} shadow-[0_0_16px_rgba(79,147,255,0.35)]`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Current Summary</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
            <div
              className="h-full rounded-full shadow-[0_0_14px_rgba(79,147,255,0.45)]"
              style={{ width: `${projectSignalRows[0]?.value ?? 0}%`, background: projectSignalRows[0]?.color ?? "#4f93ff" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-white/72 sm:text-[14px]">{currentSummary}</p>
        </div>
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Last Known State</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
            <div
              className="h-full rounded-full shadow-[0_0_14px_rgba(20,195,142,0.42)]"
              style={{ width: `${projectSignalRows[1]?.value ?? 0}%`, background: projectSignalRows[1]?.color ?? "#14c38e" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-white/72 sm:text-[14px]">{lastKnownState}</p>
        </div>
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Next Recommended Action</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
            <div
              className="h-full rounded-full shadow-[0_0_14px_rgba(155,123,255,0.42)]"
              style={{ width: `${projectSignalRows[2]?.value ?? 0}%`, background: projectSignalRows[2]?.color ?? "#9b7bff" }}
            />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-white/72 sm:text-[14px]">{nextRecommendedAction}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Open Loops</p>
          <div className="mt-2.5 space-y-2">
            {openLoopRows.map((row) => (
              <div key={row.loop} className={subCardClass}>
                <p className="text-[12px] leading-6 text-white/72 sm:text-[13px]">{row.loop}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                  <div className="h-full rounded-full bg-[#f0b429] shadow-[0_0_14px_rgba(240,180,41,0.4)]" style={{ width: `${row.pressure}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Active Workstreams</p>
          <div className="mt-2.5 space-y-2">
            {workstreamRows.map((workstream) => (
              <div key={workstream.title} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] sm:text-[15px]">{workstream.title}</p>
                  <span className="rounded-[6px] border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50">
                    {workstream.status}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-6 text-white/62 sm:text-[13px]">{workstream.detail}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                  <div className="h-full rounded-full bg-[#4f93ff] shadow-[0_0_14px_rgba(79,147,255,0.4)]" style={{ width: `${workstream.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Recent Memories</p>
          <svg viewBox="0 0 320 90" className="mt-2 h-[82px] w-full">
            <defs>
              <linearGradient id="memory-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14c38e" />
                <stop offset="100%" stopColor="#72ffd2" />
              </linearGradient>
            </defs>
            <line x1="10" y1="80" x2="310" y2="80" stroke="#252525" strokeWidth="1" />
            <polyline points={memoryConfidenceLine} fill="none" stroke="url(#memory-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="mt-2.5 space-y-2">
            {memoryConfidenceRows.map((memory) => (
              <div key={memory.id} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold tracking-[-0.02em] sm:text-[14px]">{memory.type}</p>
                  <span className="text-[12px] text-white/40">confidence {memory.confidence}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-6 text-white/68 sm:text-[13px]">{memory.detail}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                  <div className="h-full rounded-full bg-[#14c38e] shadow-[0_0_14px_rgba(20,195,142,0.4)]" style={{ width: `${memory.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Latest Handoff</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[92px] w-[92px] shrink-0 rounded-full shadow-[0_0_26px_rgba(79,147,255,0.22)]" style={donutStyle(handoffSlices)}>
              <div className="absolute inset-[16px] grid place-items-center rounded-full bg-[#111521] text-[13px] font-semibold text-[#8bb5ff]">
                {handoffScore}%
              </div>
            </div>
            <div>
              <p className="text-[12px] text-white/52">handoff trust score</p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{handoffScore}</p>
            </div>
          </div>
          <div className={`mt-2.5 ${subCardClass}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold tracking-[-0.02em] sm:text-[15px]">{latestHandoff.title}</p>
              <span className="rounded-[6px] border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50">
                {latestHandoff.status}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-6 text-white/66 sm:text-[13px]">{latestHandoff.detail}</p>
            <button
              type="button"
              className="mt-2.5 rounded-[8px] border border-[#4f93ff]/40 bg-[#4f93ff]/14 px-3.5 py-2 text-[12px] font-medium text-[#a9c7ff] transition hover:bg-[#4f93ff]/22"
            >
              Generate first handoff
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Quality Status</p>
          <svg viewBox="0 0 340 120" className="mt-2 h-[96px] w-full">
            <defs>
              <linearGradient id="quality-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f93ff" />
                <stop offset="100%" stopColor="#9b7bff" />
              </linearGradient>
            </defs>
            <line x1="12" y1="108" x2="328" y2="108" stroke="#252525" strokeWidth="1" />
            <polyline points={qualityLine} fill="none" stroke="url(#quality-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
            {qualityValues.map((value, index) => {
              const x = 12 + (index / Math.max(qualityValues.length - 1, 1)) * 316;
              const min = Math.min(...qualityValues);
              const max = Math.max(...qualityValues);
              const range = max - min || 1;
              const y = 108 - ((value - min) / range) * 84;
              return <circle key={`${value}-${index}`} cx={x} cy={y} r="3" fill="#bdd8ff" />;
            })}
          </svg>
          <div className="mt-1.5 space-y-2">
            {qualityGraphRows.map((row) => (
              <div key={row.label} className={subCardClass}>
                <div className="flex items-center justify-between gap-3 text-[12px] sm:text-[13px]">
                  <p className="text-white/68">{row.label}</p>
                  <p className="font-semibold">{row.value}</p>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                  <div className="h-full rounded-full shadow-[0_0_12px_rgba(79,147,255,0.32)]" style={{ width: `${row.normalized}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Integration Health</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[92px] w-[92px] shrink-0 rounded-full shadow-[0_0_26px_rgba(20,195,142,0.2)]" style={donutStyle(integrationSlices)}>
              <div className="absolute inset-[16px] grid place-items-center rounded-full bg-[#111521] text-[13px] font-semibold text-[#8dd8ba]">
                {integrationScore}%
              </div>
            </div>
            <div>
              <p className="text-[12px] text-white/52">Overall health score</p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{integrationScore}</p>
            </div>
          </div>
          <div className="mt-2.5 space-y-2">
            {integrationGraphRows.map((row) => (
              <div key={row.label} className={subCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] text-white/68 sm:text-[13px]">{row.label}</p>
                  <p className="text-[12px] font-semibold sm:text-[13px]">{row.value}</p>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                  <div className="h-full rounded-full bg-[#14c38e] shadow-[0_0_12px_rgba(20,195,142,0.35)]" style={{ width: `${row.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={secondaryPanelClass}>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">Recent Requests</p>
          <svg viewBox="0 0 320 90" className="mt-2 h-[82px] w-full">
            <defs>
              <linearGradient id="request-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9b7bff" />
                <stop offset="100%" stopColor="#d6b8ff" />
              </linearGradient>
            </defs>
            <line x1="10" y1="80" x2="310" y2="80" stroke="#252525" strokeWidth="1" />
            <polyline points={requestActivityLine} fill="none" stroke="url(#request-line-gradient)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="mt-1.5 space-y-2">
            {requestBars.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-white/16 bg-[#101521] px-3 py-3 text-[12px] text-white/55">
                No request activity yet. Run retrieve/resume from Playground.
              </div>
            ) : (
              requestBars.map((request) => (
                <div key={request.id} className={subCardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold tracking-[-0.02em] sm:text-[14px]">{request.method}</p>
                    <span className="rounded-[6px] border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/50">
                      {request.state}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-white/62 sm:text-[13px]">{request.detail}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a202d]">
                    <div className="h-full rounded-full bg-[#9b7bff] shadow-[0_0_12px_rgba(155,123,255,0.35)]" style={{ width: `${request.score}%` }} />
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
