"use client";

import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import {
  INTEL_LINE_CELL,
  IntelLineGridFrame,
  IntelPageStack,
  IntelSectionGutter,
  IntelTileGrid,
  intelPanelBleed,
  intelSectionRootClass,
  IntelSectionScroll,
} from "@/components/developer-console/intel-line-grid";
import {
  IntelligenceBreadcrumb,
  IntelligenceDataTable,
  IntelligenceEntityHeader,
  IntelligenceStatusBadge,
  IntelligenceWorkspace,
  type IntelTableRow,
} from "@/components/developer-console/os-intelligence-shell";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { cn } from "@/lib/utils";

type MemoryEvolutionRecord = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
};

type TimelineSignal = {
  id: string;
  eventType: string;
  timestamp: string;
};

type MemoryEvolutionSectionProps = {
  workspaceName?: string;
  memories: MemoryEvolutionRecord[];
  requestEvents: RequestSectionEvent[];
  timelineEvents?: TimelineSignal[];
  openLoops: string[];
  timelineCount: number;
  isLoading?: boolean;
  errorMessage?: string | null;
};

type EvolutionEvent = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
  status: string;
};

function cleanText(value: string | undefined, fallback: string) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function requestEvolutionLabel(event: RequestSectionEvent) {
  if (event.type === "resume") return "Continuation state assembled";
  if (event.type === "handoff") return "Agent handoff generated";
  if (event.type === "retrieve") return "Retrieval path executed";
  if (event.type === "timeline") return "Memory timeline inspected";
  if (event.type === "memory_add") return "Memory evolved";
  return "Runtime signal captured";
}

function statusTone(status: string): IntelTableRow["sourceTone"] {
  const normalized = status.toLowerCase();
  if (normalized === "error" || normalized === "failed") return "rose";
  if (normalized === "success" || normalized === "active" || normalized === "accepted") {
    return "cyan";
  }
  return "slate";
}

function displayStatus(status: string) {
  if (status === "Success") return "Success";
  if (status === "active") return "Active";
  if (status === "accepted") return "Accepted";
  return status || "Unknown";
}

export function MemoryEvolutionSection({
  workspaceName = "MemoryOS",
  memories,
  requestEvents,
  timelineEvents = [],
  openLoops,
  timelineCount,
  isLoading = false,
  errorMessage = null,
}: MemoryEvolutionSectionProps) {
  const evolutionEvents = useMemo(() => {
    const memoryEvents: EvolutionEvent[] = memories.map((memory) => ({
      id: `memory-${memory.id}`,
      at: memory.updatedAt,
      kind: (memory.type || "memory").toUpperCase(),
      title: cleanText(memory.summary || memory.type, "Memory updated"),
      detail: cleanText(memory.content, "Structured memory changed."),
      status: memory.status || "active",
    }));

    const runtimeEvents: EvolutionEvent[] = requestEvents.map((event) => ({
      id: `runtime-${event.id}`,
      at: event.createdAt,
      kind: (event.type || "runtime").toUpperCase(),
      title: requestEvolutionLabel(event),
      detail: cleanText(
        event.responseSummary || event.payloadSummary || event.route,
        event.route,
      ),
      status: event.status,
    }));

    const backendTimelineEvents: EvolutionEvent[] = timelineEvents.map((event) => ({
      id: `timeline-${event.id}`,
      at: event.timestamp,
      kind: (event.eventType || "timeline").toUpperCase(),
      title: cleanText(event.eventType.replace(/_/g, " "), "Timeline signal"),
      detail: "Live backend timeline event from memory lifecycle.",
      status: "active",
    }));

    return [...memoryEvents, ...runtimeEvents, ...backendTimelineEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 80);
  }, [memories, requestEvents, timelineEvents]);

  const activeTypes = new Set(memories.map((memory) => memory.type || "memory")).size;
  const streamLive = evolutionEvents.length > 0 || timelineCount > 0;

  const tableRows: IntelTableRow[] = useMemo(
    () =>
      evolutionEvents.map((event, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: event.title,
        operator: event.kind,
        detail: event.detail,
        value: formatDateTime(event.at),
        source: displayStatus(event.status),
        sourceTone: statusTone(event.status),
      })),
    [evolutionEvents],
  );

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Memory Evolution Timeline"]}
        />
        <IntelligenceEntityHeader
          icon={GitBranch}
          title="Memory Evolution Timeline"
          badge={
            <IntelligenceStatusBadge live={streamLive}>
              {streamLive
                ? `${timelineCount} backend timeline events`
                : "Evolution stream idle"}
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              How company intelligence changes over time across memories, retrieval calls,
              handoffs, and runtime events.
            </span>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  ["Memory records", memories.length.toString(), "Indexed evolution nodes"],
                  ["Runtime events", requestEvents.length.toString(), "Captured API signals"],
                  ["Memory classes", activeTypes.toString(), "Distinct taxonomy spread"],
                  ["Open loops", openLoops.length.toString(), "Actionable follow-ups"],
                ].map(([label, value, detail]) => (
                  <div key={label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#111827]">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">{detail}</p>
                  </div>
                ))}
              </IntelTileGrid>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      Organizational memory evolution
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Merged memory updates and runtime signals, newest first.
                    </p>
                  </div>
                  <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                    {evolutionEvents.length} events
                    {timelineCount > 0 ? ` · ${timelineCount} timeline` : ""}
                    {openLoops.length > 0 ? ` · ${openLoops.length} open loops` : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={tableRows}
                    emptyMessage={
                      isLoading
                        ? "Loading evolution stream…"
                        : errorMessage ??
                          "No memory evolution yet. Create memories, retrieve context, or run a handoff to build the first evolution trail."
                    }
                  />
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />
          </IntelPageStack>
        </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>
    </div>
  );
}
