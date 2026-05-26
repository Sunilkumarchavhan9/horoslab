"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
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

const REQUEST_TIME_FILTERS = ["1d", "7d", "30d", "All"] as const;
const REQUEST_STATUS_FILTERS = ["All statuses", "Success", "Error"] as const;

type RequestTimeFilter = (typeof REQUEST_TIME_FILTERS)[number];
type RequestStatusFilter = (typeof REQUEST_STATUS_FILTERS)[number];

export type RequestSectionEvent = {
  id: string;
  createdAt: string;
  type: string;
  status: "Success" | "Error";
  latencyMs: number;
  route: string;
  method: string;
  statusCode: number;
  agent?: string;
  payloadSummary?: string;
  responseSummary?: string;
  errorDetails?: string;
};

type RequestsSectionProps = {
  workspaceName?: string;
  requestEvents: RequestSectionEvent[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeRequestType(type: string): string {
  return type.trim().length > 0 ? type : "other";
}

function sanitizeRoute(route: string): string {
  try {
    const [pathname, query = ""] = route.split("?");
    if (!query) return pathname;
    const params = new URLSearchParams(query);
    for (const key of Array.from(params.keys())) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes("token") ||
        normalizedKey.includes("secret") ||
        normalizedKey.includes("key") ||
        normalizedKey.includes("code")
      ) {
        params.set(key, "[redacted]");
      }
    }
    const sanitized = params.toString();
    return sanitized ? `${pathname}?${sanitized}` : pathname;
  } catch {
    return route.replace(/([?&](?:token|secret|key|code)=)[^&]+/gi, "$1[redacted]");
  }
}

function shouldHideRoute(route: string): boolean {
  const pathname = route.split("?")[0]?.toLowerCase() ?? route.toLowerCase();
  return pathname.endsWith("/api/memory/events") || pathname.endsWith("/api/connector/events");
}

function requestTitle(event: RequestSectionEvent): string {
  const type = normalizeRequestType(event.type);
  if (type === "resume") return "Resume context generated";
  if (type === "handoff") return "Agent handoff generated";
  if (type === "retrieve") return "Memory retrieval executed";
  if (type === "memory_add") return "Memory written";
  if (type === "memory_list") return "Memory registry loaded";
  if (type === "timeline") return "Timeline inspected";
  if (type === "insights") return "Memory insights refreshed";
  if (type === "explain") return "Memory explanation requested";
  return `${event.method} ${sanitizeRoute(event.route).split("?")[0]}`;
}

function requestDescription(event: RequestSectionEvent): string {
  const type = normalizeRequestType(event.type);
  if (event.status === "Error") {
    return event.errorDetails ?? `Backend returned HTTP ${event.statusCode}.`;
  }
  if (type === "resume") return "MemoryOS assembled project context so the next agent can continue.";
  if (type === "handoff") return "Generated a transfer brief for another agent or teammate.";
  if (type === "retrieve") return "Selected memory candidates for an agent/runtime call.";
  if (type === "memory_add") return "Stored or evolved context in the company memory layer.";
  if (type === "memory_list") return "Loaded active memory records for the console.";
  if (type === "timeline") return "Loaded memory activity for audit and traceability.";
  if (type === "insights") return "Calculated health, impact, and continuity signals.";
  return sanitizeRoute(event.route);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function shortText(input: string | undefined | null, max = 120): string {
  if (!input) return "—";
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}

function sourceToneForRequest(event: RequestSectionEvent): IntelTableRow["sourceTone"] {
  if (event.status === "Error") return "rose";
  const route = event.route.toLowerCase();
  if (route.includes("connector")) return "cyan";
  if (route.includes("resume") || route.includes("handoff")) return "violet";
  if (route.includes("retrieve")) return "amber";
  return "slate";
}

function sourceLabelForRequest(event: RequestSectionEvent): string {
  const type = normalizeRequestType(event.type);
  if (event.status === "Error") return `${event.statusCode} error`;
  if (type === "retrieve") return "Retrieval";
  if (type === "resume") return "Continuity";
  if (type === "handoff") return "Handoff";
  if (type === "memory_add") return "Memory write";
  if (event.route.includes("connector")) return "Connector";
  return `${event.statusCode} OK`;
}

function percentile(values: number[], p: number): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? null;
}

export function RequestsSection({
  workspaceName = "MemoryOS",
  requestEvents,
  isLoading = false,
  errorMessage = null,
}: RequestsSectionProps) {
  const [liveEvents, setLiveEvents] = useState<RequestSectionEvent[]>(requestEvents);
  const [requestTimeFilter, setRequestTimeFilter] = useState<RequestTimeFilter>("30d");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("All types");
  const [requestStatusFilter, setRequestStatusFilter] =
    useState<RequestStatusFilter>("All statuses");
  const [lastUpdated, setLastUpdated] = useState<string>("-");

  useEffect(() => {
    const deduped = Array.from(new Map(requestEvents.map((event) => [event.id, event])).values())
      .filter((event) => !shouldHideRoute(event.route))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLiveEvents(deduped);
    setLastUpdated(new Date().toISOString());
  }, [requestEvents]);

  const requestTypeFilters = useMemo(() => {
    const dynamicTypes = Array.from(
      new Set(liveEvents.map((event) => normalizeRequestType(event.type))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All types", ...dynamicTypes];
  }, [liveEvents]);

  const filteredRequestEvents = useMemo(() => {
    const referenceTimeMs = Date.now();
    const maxAgeMs =
      requestTimeFilter === "All"
        ? null
        : requestTimeFilter === "1d"
          ? ONE_DAY_MS
          : requestTimeFilter === "7d"
            ? 7 * ONE_DAY_MS
            : 30 * ONE_DAY_MS;

    return liveEvents.filter((event) => {
      const matchesType =
        requestTypeFilter === "All types" ||
        normalizeRequestType(event.type) === requestTypeFilter;
      const matchesStatus =
        requestStatusFilter === "All statuses" || event.status === requestStatusFilter;
      const eventTimeMs = new Date(event.createdAt).getTime();
      const matchesTime =
        maxAgeMs === null ||
        (Number.isFinite(eventTimeMs) && referenceTimeMs - eventTimeMs <= maxAgeMs);
      return matchesType && matchesStatus && matchesTime;
    });
  }, [liveEvents, requestTimeFilter, requestTypeFilter, requestStatusFilter]);

  const successfulRequestCount = filteredRequestEvents.filter((e) => e.status === "Success").length;
  const errorCount = filteredRequestEvents.length - successfulRequestCount;
  const successRate =
    filteredRequestEvents.length > 0
      ? Math.round((successfulRequestCount / filteredRequestEvents.length) * 100)
      : 0;
  const p95Latency = percentile(
    filteredRequestEvents.filter((e) => e.status === "Success").map((e) => e.latencyMs),
    95,
  );

  const hasRows = filteredRequestEvents.length > 0;
  const streamLive = hasRows || liveEvents.length > 0;

  const tableRows: IntelTableRow[] = useMemo(
    () =>
      filteredRequestEvents.slice(0, 80).map((event, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: requestTitle(event),
        operator: event.agent ?? event.method ?? "system",
        detail: shortText(
          event.responseSummary ?? event.payloadSummary ?? requestDescription(event),
          120,
        ),
        value: `${event.latencyMs}ms · ${formatTime(event.createdAt)}`,
        source: sourceLabelForRequest(event),
        sourceTone: sourceToneForRequest(event),
      })),
    [filteredRequestEvents],
  );

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Runtime Activity"]}
        />
        <IntelligenceEntityHeader
          icon={Activity}
          title="Runtime Activity"
          badge={
            <IntelligenceStatusBadge live={streamLive}>
              {streamLive ? "Live backend stream" : "Awaiting events"}
            </IntelligenceStatusBadge>
          }
          meta={
            <>
              <span className="text-[#9CA3AF]">Observability trace stream</span>
              <span className="hidden text-[#E5E7EB] sm:inline">·</span>
              <span>
                Updated {lastUpdated === "-" ? "—" : formatTime(lastUpdated)}
              </span>
            </>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div
                className={cn(
                  INTEL_LINE_CELL,
                  "flex flex-wrap items-center justify-between gap-3 py-4",
                )}
              >
                <p className="text-xs text-[#6B7280]">
                  Filter the execution ledger by time window, request type, and status.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {REQUEST_TIME_FILTERS.map((range) => (
                      <button
                        key={range}
                        type="button"
                        data-no-pixel-load
                        onClick={() => setRequestTimeFilter(range)}
                        className={cn(
                          "intel-filter-chip h-9 border px-3 text-xs font-semibold uppercase tracking-[0.14em]",
                          requestTimeFilter === range
                            ? "border-[#111827] bg-[#111827] text-white"
                            : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]",
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <select
                    value={requestTypeFilter}
                    onChange={(e) => setRequestTypeFilter(e.target.value)}
                    className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#374151] outline-none focus:border-[#D1D5DB] focus:ring-2 focus:ring-black/[0.04]"
                  >
                    {requestTypeFilters.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) =>
                      setRequestStatusFilter(e.target.value as RequestStatusFilter)
                    }
                    className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#374151] outline-none focus:border-[#D1D5DB] focus:ring-2 focus:ring-black/[0.04]"
                  >
                    {REQUEST_STATUS_FILTERS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  {
                    label: "Live requests",
                    value: filteredRequestEvents.length.toString(),
                    detail: "Current filtered window",
                  },
                  {
                    label: "Success rate",
                    value: `${successRate}%`,
                    detail: `${successfulRequestCount} successful`,
                  },
                  {
                    label: "P95 latency",
                    value: p95Latency !== null ? `${p95Latency}ms` : "—",
                    detail: "Successful calls only",
                  },
                  {
                    label: "Needs attention",
                    value: errorCount.toString(),
                    detail: "Errors and blocked requests",
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
                      Runtime execution ledger
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Observability-style trace stream from your organizational memory runtime.
                    </p>
                  </div>
                  <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                    {hasRows ? `${filteredRequestEvents.length} events` : "Waiting for events"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={tableRows}
                    emptyMessage={
                      isLoading
                        ? "Loading request stream…"
                        : errorMessage ??
                          "No runtime requests yet. Run retrieve, resume, handoff, or playground flows — events appear from live backend activity only."
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
