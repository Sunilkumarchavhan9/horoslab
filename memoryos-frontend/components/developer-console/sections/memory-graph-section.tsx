"use client";

import { useMemo } from "react";
import { Network } from "lucide-react";
import {
  ConsoleEmptyState,
} from "@/components/developer-console/console-ui";
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
  IntelligenceEntityHeader,
  IntelligenceStatusBadge,
  IntelligenceWorkspace,
} from "@/components/developer-console/os-intelligence-shell";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type MemoryGraphMemory = {
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

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
};

type MemoryGraphSectionProps = {
  workspaceName: string;
  memories: MemoryGraphMemory[];
  requestEvents: RequestSectionEvent[];
  timelineEvents?: TimelineSignal[];
  timelineCount: number;
  isLoading?: boolean;
  errorMessage?: string | null;
};

const NODE_POSITIONS = [
  "left-[8%] top-[18%]",
  "right-[9%] top-[16%]",
  "left-[14%] bottom-[18%]",
  "right-[14%] bottom-[18%]",
  "left-[43%] top-[4%]",
  "left-[42%] bottom-[6%]",
  "left-[4%] top-[48%]",
  "right-[5%] top-[48%]",
] as const;

function shortLabel(value: string, fallback: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 42 ? `${text.slice(0, 39).trimEnd()}...` : text;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MemoryGraphSection({
  workspaceName,
  memories,
  requestEvents,
  timelineEvents = [],
  timelineCount,
  isLoading = false,
  errorMessage = null,
}: MemoryGraphSectionProps) {
  const nodes = useMemo(() => {
    const memoryNodes = memories.slice(0, 5).map((memory, index) => ({
      id: memory.id,
      label: shortLabel(memory.summary || memory.content, memory.type || "memory"),
      meta: memory.type || "memory",
      position: NODE_POSITIONS[index % NODE_POSITIONS.length],
      active: memory.status !== "forgotten",
      kind: "memory" as const,
    }));

    const runtimeNodes = requestEvents.slice(0, 2).map((event, index) => ({
      id: event.id,
      label: shortLabel(event.type || event.route, "runtime event"),
      meta: `${event.status} ${event.latencyMs}ms`,
      position: NODE_POSITIONS[(memoryNodes.length + index) % NODE_POSITIONS.length],
      active: event.status === "Success",
      kind: "runtime" as const,
    }));

    const timelineNodes = timelineEvents.slice(0, 2).map((event, index) => ({
      id: event.id,
      label: shortLabel(event.eventType, "timeline"),
      meta: formatTime(event.timestamp),
      position:
        NODE_POSITIONS[(memoryNodes.length + runtimeNodes.length + index) % NODE_POSITIONS.length],
      active: true,
      kind: "timeline" as const,
    }));

    return [...memoryNodes, ...runtimeNodes, ...timelineNodes];
  }, [memories, requestEvents, timelineEvents]);

  const edges = useMemo(() => {
    const hubId = "company-brain-hub";
    const links: GraphEdge[] = nodes.map((node) => ({
      id: `${hubId}-${node.id}`,
      from: hubId,
      to: node.id,
      label: node.kind === "memory" ? "indexed" : node.kind === "runtime" ? "executed" : "evolved",
    }));

    const anchorMemory = nodes.find((node) => node.kind === "memory");
    for (const runtimeNode of nodes.filter((node) => node.kind === "runtime")) {
      if (!anchorMemory) break;
      links.push({
        id: `${anchorMemory.id}-${runtimeNode.id}`,
        from: anchorMemory.id,
        to: runtimeNode.id,
        label: "retrieval path",
      });
    }

    return links.slice(0, 12);
  }, [nodes]);

  const typeCount = new Set(memories.map((memory) => memory.type || "memory")).size;
  const successfulRuntimeCount = requestEvents.filter(
    (event) => event.status === "Success",
  ).length;
  const hasGraph = nodes.length > 0;

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceName, "Memory Graph"]}
        />
        <IntelligenceEntityHeader
          icon={Network}
          title="Memory Graph"
        badge={
          <IntelligenceStatusBadge live={hasGraph}>
            {hasGraph ? "Live graph substrate" : "Awaiting nodes"}
          </IntelligenceStatusBadge>
        }
        meta={
          <span className="text-[#9CA3AF]">
            Live memory graph for {workspaceName} — nodes, links, runtime signals, and ingest
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
                ["Indexed memories", memories.length.toString(), "Live graph nodes"],
                ["Runtime links", successfulRuntimeCount.toString(), "Successful API paths"],
                ["Distinct types", typeCount.toString(), "Memory taxonomy spread"],
                ["Timeline events", timelineCount.toString(), "Lifecycle + ingest signals"],
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
            <div className="memory-graph-chart-row">
              <div
                className={cn(
                  INTEL_LINE_CELL,
                  "memory-graph-stage-cell relative min-h-[560px] p-0",
                )}
              >
                <div className="absolute inset-0 memoryos-neural-grid opacity-80" />
                <div className="absolute inset-x-8 top-1/2 h-px bg-[#E5E7EB]" />
                <div className="absolute inset-y-8 left-1/2 w-px bg-[#E5E7EB]" />

                <div className="absolute left-1/2 top-1/2 z-10 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#E5E7EB] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B7280]">
                      Company Brain
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#111827]">
                      {workspaceName}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {memories.length} memories
                    </p>
                  </div>
                </div>

                {!hasGraph ? (
                  <div className="relative z-10 grid min-h-[560px] place-items-center px-6">
                    <ConsoleEmptyState
                      title={isLoading ? "Building graph..." : "No graph nodes yet"}
                      description={
                        errorMessage ??
                        "Connect a source or write memory to populate the first live graph nodes."
                      }
                    />
                  </div>
                ) : (
                  nodes.map((node, index) => (
                    <div
                      key={node.id}
                      className={`absolute z-20 w-44 rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-sm ${node.position}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            node.active ? "bg-[#14B8A6]" : "bg-[#EF4444]"
                          }`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">
                          node {index + 1}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-snug text-[#111827]">
                        {node.label}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#6B7280]">
                        {node.meta}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="memory-graph-sidebar-stack">
                <div className={cn(INTEL_LINE_CELL, "memory-graph-sidebar-cell")}>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#EF4444]">
                    Graph Health
                  </p>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Memory nodes", memories.length.toString()],
                      ["Runtime links", successfulRuntimeCount.toString()],
                      ["Live edges", edges.length.toString()],
                      ["Memory types", typeCount.toString()],
                      ["Timeline events", timelineCount.toString()],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-sm text-[#6B7280]">{label}</span>
                        <span className="font-mono text-lg font-semibold tabular-nums text-[#111827]">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(INTEL_LINE_CELL, "memory-graph-sidebar-cell")}>
                  <div className="flex items-center gap-2">
                    <Icon name="timeline" className="h-4 w-4 text-[#EF4444]" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#EF4444]">
                      Latest Signals
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {requestEvents.slice(0, 5).length === 0 ? (
                      <p className="text-sm text-[#6B7280]">
                        No runtime signals captured yet.
                      </p>
                    ) : (
                      requestEvents.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          className="border border-[#E5E7EB] bg-[#F9FAFB] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-semibold text-[#111827]">
                              {event.type || event.method}
                            </p>
                            <span className="font-mono text-[10px] text-[#9CA3AF]">
                              {formatTime(event.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-[#6B7280]">
                            {event.route}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
