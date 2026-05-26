"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, LayoutDashboard, Orbit, PlugZap, Code2 } from "lucide-react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { intelContentPad } from "@/components/developer-console/intel-design";
import {
  INTEL_LINE_CELL,
  IntelLineGridFrame,
  IntelPageStack,
  IntelSectionGutter,
  IntelSectionScroll,
  IntelTileGrid,
  intelPanelBleed,
  intelSectionRootClass,
} from "@/components/developer-console/intel-line-grid";
import { CompanyBrainFunnelPanel } from "@/components/developer-console/company-brain-funnel-panel";
import { CompanyBrainPillarStrip } from "@/components/developer-console/company-brain-pillar-strip";
import { CONSOLE_SECTION_BRAIN } from "@/lib/company-brain";
import type { FunnelProgressInput } from "@/lib/company-brain-funnel";
import { cn } from "@/lib/utils";
import {
  IntelligenceBreadcrumb,
  IntelligenceDataTable,
  IntelligenceEntityHeader,
  IntelligenceFlowChart,
  IntelligenceFlowInsightPanel,
  IntelligenceGhostButton,
  IntelligencePrimaryButton,
  IntelligenceStatusBadge,
  IntelligenceTableToolbar,
  IntelligenceWorkspace,
  buildIntelChartSeries,
  collectOverviewFlowEvents,
  type IntelTableRow,
} from "@/components/developer-console/os-intelligence-shell";

type ActionCardTitle = "Quick Start" | "Continuity Lab" | "Playground" | "Documentation";
type OverviewActionHandlers = Partial<Record<ActionCardTitle, () => void>>;
type InstallationVerificationStatus = "idle" | "waiting" | "connected" | "error";

type OverviewSectionProps = {
  workspaceName?: string;
  ownerName?: string;
  actions?: OverviewActionHandlers;
  stats?: Array<{ label: string; value: string; accent?: string }>;
  isLoading?: boolean;
  errorMessage?: string | null;
  memories?: Array<{ content: string; type?: string; updatedAt: string }>;
  requestEvents?: RequestSectionEvent[];
  insights?: {
    activeProjects?: string[];
  } | null;
  resumeData?: {
    summary?: string;
    recommendedNextStep?: string;
    openLoops?: string[];
  } | null;
  handoffData?: {
    openLoops?: string[];
  } | null;
  timelineCount?: number;
  timelineEvents?: Array<{ id: string; eventType: string; timestamp: string }>;
  installationVerification?: {
    status: InstallationVerificationStatus;
    message: string;
    onVerify: () => void;
  };
  githubFunnel?: { connected: boolean; synced: boolean };
  hasResumeBrief?: boolean;
  funnelActions?: {
    onConnectGithub: () => void;
    onSyncGithub: () => void;
    onContinueBrief: () => void;
    onOpenLab: () => void;
  };
};

function shortText(input: string | undefined | null, max = 180): string {
  if (!input) return "Not available yet.";
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function isSuccessfulRoute(event: RequestSectionEvent, fragment: string): boolean {
  return event.status === "Success" && event.route.includes(fragment);
}

function sourceToneForEvent(event: RequestSectionEvent): IntelTableRow["sourceTone"] {
  const route = event.route.toLowerCase();
  if (route.includes("connector")) return "cyan";
  if (route.includes("resume") || route.includes("handoff")) return "violet";
  if (route.includes("retrieve")) return "amber";
  return "slate";
}

function sourceLabelForEvent(event: RequestSectionEvent): string {
  const type = event.type?.toLowerCase() ?? "";
  if (type === "retrieve") return "Retrieval";
  if (type === "resume") return "Continuity";
  if (type === "handoff") return "Agent handoff";
  if (type === "memory_add") return "Memory write";
  if (event.route.includes("connector")) return "Connector sync";
  return "Runtime API";
}

function eventTitle(event: RequestSectionEvent): string {
  const type = event.type?.toLowerCase() ?? "";
  if (type === "resume") return "Resume context assembled";
  if (type === "handoff") return "Cross-agent handoff";
  if (type === "retrieve") return "Memory retrieval";
  if (type === "memory_add") return "Memory evolved";
  return `${event.method} ${event.route.split("?")[0]}`;
}

export function OverviewSection({
  workspaceName = "MemoryOS",
  ownerName = "Operator",
  actions,
  stats = [],
  isLoading = false,
  errorMessage = null,
  memories = [],
  requestEvents = [],
  insights = null,
  resumeData = null,
  handoffData = null,
  timelineCount = 0,
  timelineEvents = [],
  installationVerification,
  githubFunnel = { connected: false, synced: false },
  hasResumeBrief = false,
  funnelActions,
}: OverviewSectionProps) {
  const funnelProgress: FunnelProgressInput = {
    githubConnected: githubFunnel.connected,
    githubSynced:
      githubFunnel.synced ||
      memories.length > 0 ||
      requestEvents.some((e) => e.status === "Success" && e.route.includes("/connector/github")),
    hasBrief: hasResumeBrief,
    labOpened: false,
  };
  const [chartRange, setChartRange] = useState("M");
  const verificationStatus = installationVerification?.status ?? "idle";
  const isConnected = verificationStatus === "connected";

  const successfulEvents = requestEvents.filter((event) => event.status === "Success");
  const hasSourceConnected =
    memories.length > 0 ||
    successfulEvents.some(
      (event) =>
        isSuccessfulRoute(event, "/api/connector") ||
        isSuccessfulRoute(event, "/api/memory/process") ||
        isSuccessfulRoute(event, "/api/memory/list"),
    );

  const focusThread = insights?.activeProjects?.[0]?.trim();
  const showFocusThread =
    typeof focusThread === "string" &&
    focusThread.length > 0 &&
    focusThread !== "Organizational runtime";

  const latestMemoryAt = memories[0]?.updatedAt
    ? new Date(memories[0].updatedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Awaiting first sync";

  const flowEvents = useMemo(
    () => collectOverviewFlowEvents(requestEvents, timelineEvents, memories),
    [requestEvents, timelineEvents, memories],
  );

  const retrieveCount = flowEvents.filter((e) => e.kind === "retrieve").length;
  const memoryWriteCount = flowEvents.filter((e) => e.kind === "memory").length;
  const resumeCount = requestEvents.filter(
    (e) => e.route.includes("resume") || e.route.includes("handoff"),
  ).length;
  const handoffCount = handoffData?.openLoops?.length ?? resumeData?.openLoops?.length ?? 0;

  const memoryStat = Number(stats.find((s) => s.label.includes("Memories"))?.value ?? memories.length);
  const kpiRetrieval = Math.min(10, retrieveCount + (timelineCount > 0 ? 2 : 0));
  const kpiMemory = Math.min(10, memoryStat / Math.max(1, 3));
  const kpiContinuity = Math.min(10, resumeCount * 2 + (resumeData?.summary ? 3 : 0));
  const continuityIdle = kpiContinuity <= 0;

  const chartData = useMemo(
    () => buildIntelChartSeries(flowEvents, chartRange),
    [flowEvents, chartRange],
  );

  const tableRows: IntelTableRow[] = useMemo(
    () =>
      requestEvents.slice(0, 12).map((event, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: eventTitle(event),
        operator: event.agent ?? event.method ?? "system",
        detail: shortText(event.responseSummary ?? event.payloadSummary ?? event.route, 120),
        value: `${event.latencyMs}ms`,
        source: sourceLabelForEvent(event),
        sourceTone: sourceToneForEvent(event),
      })),
    [requestEvents],
  );

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Overview"]}
          actions={
            <>
              <IntelligenceGhostButton
                loading={verificationStatus === "waiting"}
                onClick={installationVerification?.onVerify}
              >
                Verify live
              </IntelligenceGhostButton>
              <IntelligencePrimaryButton onClick={actions?.["Continuity Lab"]}>
                Continuity Lab ↗
              </IntelligencePrimaryButton>
            </>
          }
        />

        <IntelligenceEntityHeader
          icon={LayoutDashboard}
          title={workspaceName}
          badge={
            <IntelligenceStatusBadge live={hasSourceConnected}>
              {hasSourceConnected ? "Live intelligence" : "Awaiting sources"}
            </IntelligenceStatusBadge>
          }
          meta={
            <>
              <span className="text-[#9CA3AF]">Operational control center</span>
              <span className="hidden text-[#E5E7EB] sm:inline">·</span>
              <span className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-[#E0E7FF] text-[10px] font-semibold text-[#4338CA]">
                  {ownerName.slice(0, 1).toUpperCase()}
                </span>
                {ownerName}
              </span>
              <span>Last memory · {latestMemoryAt}</span>
              {showFocusThread ? (
                <span
                  className="max-w-[220px] truncate rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-xs text-[#374151]"
                  title={focusThread}
                >
                  Focus · {shortText(focusThread, 36)}
                </span>
              ) : null}
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-[#059669]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  SDK connected
                </span>
              ) : null}
            </>
          }
          kpis={[
            { label: "Retrieval", value: kpiRetrieval, tone: "cyan" },
            { label: "Memory", value: kpiMemory, tone: "rose" },
            {
              label: "Continuity",
              value: kpiContinuity,
              tone: "amber",
              displayValue: continuityIdle ? "Ready" : undefined,
              idle: continuityIdle,
            },
          ]}
        />

        <IntelSectionScroll>
        <div className={cn(intelPanelBleed, "overview-prody-stack")}>
          <IntelPageStack>
            <CompanyBrainPillarStrip
              pillars={CONSOLE_SECTION_BRAIN.Overview.pillars}
              purpose={CONSOLE_SECTION_BRAIN.Overview.purpose}
              executionTier={CONSOLE_SECTION_BRAIN.Overview.executionTier}
            />
            {funnelActions ? (
              <>
                <IntelSectionGutter />
                <CompanyBrainFunnelPanel
                  progress={funnelProgress}
                  onConnectGithub={funnelActions.onConnectGithub}
                  onSyncGithub={funnelActions.onSyncGithub}
                  onContinueBrief={funnelActions.onContinueBrief}
                  onOpenLab={funnelActions.onOpenLab}
                />
              </>
            ) : null}
            <IntelSectionGutter />
            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  {
                    label: "Memories indexed",
                    value: String(memoryStat),
                    detail: hasSourceConnected ? "Live organizational memory" : "Connect a source",
                  },
                  {
                    label: "Runtime events",
                    value: String(requestEvents.length),
                    detail: "Filtered observability window",
                  },
                  {
                    label: "Retrieval calls",
                    value: String(retrieveCount),
                    detail: retrieveCount > 0 ? "Agent/runtime retrieval" : "None in window",
                  },
                  {
                    label: "Open loops",
                    value: String(handoffCount),
                    detail: continuityIdle ? "Start Continuity Lab" : "Active continuity threads",
                  },
                ].map((stat) => (
                  <div key={stat.label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#111827]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">{stat.detail}</p>
                  </div>
                ))}
              </IntelTileGrid>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className="overview-chart-row">
                <div className={cn(INTEL_LINE_CELL, "overview-chart-cell min-w-0 p-0")}>
                  <IntelligenceFlowChart
                    embedded
                    title="Operational intelligence flow"
                    subtitle={`Retrieval (${retrieveCount}) vs memory writes (${memoryWriteCount}) — live backend only.`}
                    data={chartData}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    emptyTitle="No flow signal in this window"
                    emptyDescription="Run retrieval, write memory, or connect any source (GitHub, local files, Slack, Drive, APIs, and more). The chart fills when real runtime events arrive — never from demo data."
                    emptyAction={
                      <button
                        type="button"
                        data-pixel-action
                        data-no-pixel-load
                        onClick={actions?.["Quick Start"]}
                        className="h-10 bg-[#EF4444] px-4 text-sm font-semibold text-white hover:bg-[#DC2626]"
                      >
                        + Connect source
                      </button>
                    }
                  />
                </div>
                <IntelligenceFlowInsightPanel
                  data={chartData}
                  range={chartRange}
                  retrieveCount={retrieveCount}
                  memoryWriteCount={memoryWriteCount}
                />
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="border-b border-[#E5E7EB] px-5 py-4">
                  <IntelligenceTableToolbar title="Live runtime events" onAdd={actions?.["Quick Start"]} />
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={tableRows}
                    emptyMessage="No runtime events yet. Connect any source or run the SDK — this stream fills from live backend activity only."
                  />
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="cards">
                {[
                  {
                    title: "Continuity Lab",
                    body: "Persistent reasoning workspace for developers and agents.",
                    action: actions?.["Continuity Lab"],
                    icon: BrainCircuit,
                    featured: true,
                  },
                  {
                    title: "Playground",
                    body: "Agent runtime sandbox — retrieval, injection, and execution.",
                    action: actions?.["Playground"],
                    icon: Orbit,
                    featured: false,
                  },
                  {
                    title: "Connect sources",
                    body: "GitHub, Notion, Jira, Slack, APIs — feed organizational memory.",
                    action: actions?.["Quick Start"],
                    icon: PlugZap,
                    featured: false,
                  },
                  {
                    title: "Integrations & SDK",
                    body: "SDK, MCP, REST, and agent runtime integration guides.",
                    action: actions?.["Documentation"],
                    icon: Code2,
                    featured: false,
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={card.action}
                      className={cn(
                        INTEL_LINE_CELL,
                        "flex h-full min-h-[148px] w-full flex-col text-left transition hover:bg-[#F9FAFB]",
                        card.featured && "bg-gradient-to-b from-[#EEF2FF] to-white",
                      )}
                    >
                      {card.featured ? (
                        <span className="mb-2 inline-block w-fit bg-[#4338CA] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Core
                        </span>
                      ) : null}
                      <Icon
                        className={card.featured ? "size-5 text-[#4338CA]" : "size-5 text-[#6B7280]"}
                        strokeWidth={1.5}
                      />
                      <p className="mt-3 text-sm font-semibold text-[#111827]">{card.title}</p>
                      <p className="mt-1 flex-1 text-xs leading-relaxed text-[#6B7280]">{card.body}</p>
                      <span
                        className={cn(
                          "mt-3 text-xs font-medium",
                          card.featured ? "text-[#4338CA]" : "text-[#4F46E5]",
                        )}
                      >
                        Open →
                      </span>
                    </button>
                  );
                })}
              </IntelTileGrid>
            </IntelLineGridFrame>
          </IntelPageStack>
        </div>

        <div className={cn("py-4", intelContentPad)}>
          {resumeData?.recommendedNextStep ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] px-4 py-3 text-sm text-[#4338CA]"
            >
              <span className="font-semibold text-[#312E81]">Next operational action: </span>
              {shortText(resumeData.recommendedNextStep, 220)}
            </motion.div>
          ) : null}

          {isLoading ? (
            <p className="mt-3 text-sm text-[#6B7280]">Loading live workspace data…</p>
          ) : null}
          {errorMessage ? (
            <p className="mt-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
              {errorMessage}
            </p>
          ) : null}
          {installationVerification?.message ? (
            <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#6B7280]">
              {installationVerification.message}
            </p>
          ) : null}
        </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>
    </div>
  );
}
