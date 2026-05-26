"use client";

import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
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
import { cn } from "@/lib/utils";

type FlightRecorderSectionProps = {
  workspaceName?: string;
  requestEvents: RequestSectionEvent[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

function dedupeEvents(events: RequestSectionEvent[]) {
  const deduped = Array.from(
    new Map(
      events
        .filter((item) => item && typeof item.id === "string")
        .map((item) => [item.id, item]),
    ).values(),
  ) as RequestSectionEvent[];

  return deduped.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function stripSensitiveRoute(route: string) {
  const [pathname] = route.split("?");
  return pathname || route;
}

function eventTitle(event: RequestSectionEvent) {
  const route = stripSensitiveRoute(event.route);
  if (route.includes("/memory/events")) return "Memory stream heartbeat";
  if (route.includes("/memory/timeline")) return "Timeline refreshed";
  if (route.includes("/memory/resume")) return "Resume context generated";
  if (route.includes("/memory/handoff")) return "Handoff brief generated";
  if (route.includes("/memory/list")) return "Memory registry loaded";
  if (route.includes("/memory/insights")) return "Memory insights calculated";
  if (route.includes("/memory/conflicts")) return "Conflict queue checked";
  if (route.includes("/connector")) return "Source connector checked";
  if (route.includes("/agent-sessions")) return "Agent session updated";
  if (route.includes("/agents")) return "Agent runtime listed";
  return "Runtime event captured";
}

function eventDescription(event: RequestSectionEvent) {
  const route = stripSensitiveRoute(event.route);
  if (route.includes("/memory/events")) {
    return "Live memory channel checked without exposing the auth token.";
  }
  if (route.includes("/memory/resume")) {
    return "MemoryOS assembled previous context so the next agent can continue work.";
  }
  if (route.includes("/memory/handoff")) {
    return "Generated an operating handoff for another agent or teammate.";
  }
  if (route.includes("/memory/timeline")) {
    return "Fetched the project memory timeline for audit and traceability.";
  }
  if (route.includes("/memory/list")) {
    return "Loaded reusable memories available to agent retrieval.";
  }
  if (route.includes("/memory/insights")) {
    return "Calculated memory health and continuity signals.";
  }
  if (route.includes("/memory/conflicts")) {
    return "Checked whether memory needs human review before reuse.";
  }
  if (route.includes("/connector")) {
    return "Checked source ingestion status for engineering context.";
  }
  return `${event.method} ${route}`;
}

function statusLabel(event: RequestSectionEvent) {
  if (event.statusCode === 429) return "Rate limited";
  if (event.statusCode >= 500) return "Backend issue";
  if (event.statusCode >= 400) return "Needs attention";
  return event.status === "Success" ? "Healthy" : "Failed";
}

function sourceToneForEvent(event: RequestSectionEvent): IntelTableRow["sourceTone"] {
  if (event.statusCode >= 400 || event.status === "Error") return "rose";
  const route = stripSensitiveRoute(event.route).toLowerCase();
  if (route.includes("connector")) return "cyan";
  if (route.includes("resume") || route.includes("handoff")) return "violet";
  if (route.includes("retrieve")) return "amber";
  return "slate";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortText(input: string, max = 120): string {
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

export function FlightRecorderSection({
  workspaceName = "MemoryOS",
  requestEvents,
  isLoading = false,
  errorMessage = null,
}: FlightRecorderSectionProps) {
  const [liveEvents, setLiveEvents] = useState<RequestSectionEvent[]>(
    dedupeEvents(requestEvents),
  );

  useEffect(() => {
    setLiveEvents(dedupeEvents(requestEvents));
  }, [requestEvents]);

  const timeline = useMemo(() => liveEvents.slice(0, 80), [liveEvents]);
  const successCount = liveEvents.filter((event) => event.statusCode < 400).length;
  const attentionCount = liveEvents.length - successCount;
  const p95Latency = useMemo(() => {
    const values = liveEvents
      .map((event) => event.latencyMs)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (values.length === 0) return null;
    return values[Math.min(values.length - 1, Math.floor(values.length * 0.95))] ?? null;
  }, [liveEvents]);

  const hasRows = timeline.length > 0;
  const streamLive = hasRows || liveEvents.length > 0;

  const tableRows: IntelTableRow[] = useMemo(
    () =>
      timeline.map((event, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: eventTitle(event),
        operator: event.agent ?? event.method ?? "system",
        detail: shortText(eventDescription(event), 120),
        value: `${event.latencyMs}ms · ${formatTime(event.createdAt)}`,
        source: statusLabel(event),
        sourceTone: sourceToneForEvent(event),
      })),
    [timeline],
  );

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Agent Activity Timeline"]}
        />
        <IntelligenceEntityHeader
          icon={History}
          title="Agent Activity Timeline"
          badge={
            <IntelligenceStatusBadge live={streamLive}>
              {streamLive ? "Token-safe stream" : "Awaiting activity"}
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Trace operator actions, memory calls, handoffs, resume, connector checks, and
              agent transitions — sanitized routes, no raw tokens.
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
                  {
                    label: "Captured",
                    value: liveEvents.length.toString(),
                    detail: "Sanitized events",
                  },
                  {
                    label: "Attention",
                    value: attentionCount.toString(),
                    detail: "Errors and blocked calls",
                  },
                  {
                    label: "P95 latency",
                    value: p95Latency !== null ? `${p95Latency}ms` : "—",
                    detail: "Across captured window",
                  },
                  {
                    label: "Healthy calls",
                    value: successCount.toString(),
                    detail: "HTTP status below 400",
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
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      Operational timeline
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Latest sanitized runtime events from the backend.
                    </p>
                  </div>
                  <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                    Token-safe view
                    {hasRows ? ` · ${timeline.length} shown` : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={tableRows}
                    emptyMessage={
                      isLoading
                        ? "Loading recorder events…"
                        : errorMessage ??
                          "No agent runs captured yet. Start a continuity run, handoff, or memory retrieval to populate the recorder."
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
