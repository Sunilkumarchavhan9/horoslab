"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ConsoleGrid,
  ConsoleSectionCard,
  ConsoleStatCard,
  ConsoleStatGrid,
  ConsoleStatusBadge,
} from "@/components/memoryos/console-ui";
import { consoleApiFetch } from "@/lib/console-api";
import { ArrowRight } from "lucide-react";

type MemoryRealtimeEvent = {
  id: string;
  kind: string;
  stage: string;
  occurredAt: string;
  summary: string;
  subject?: {
    type: string;
    id?: string;
    label?: string;
  };
};

type MemoryDrilldown = {
  title: string;
  description: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};

function consoleSectionHref(section: string): string {
  return `/mission-control?section=${encodeURIComponent(section)}`;
}

type MemoryRealtimeProjection = {
  userId: string;
  updatedAt: string;
  totalEvents: number;
  totalByKind: Record<string, number>;
  totalByStage: Record<string, number>;
  latestEventAt: string | null;
  latestEventId: string | null;
  recentEvents: MemoryRealtimeEvent[];
};

type LoadState = {
  projection: MemoryRealtimeProjection | null;
  events: MemoryRealtimeEvent[];
  loading: boolean;
  online: boolean;
  error: string | null;
  lastEventKind: string | null;
  lastEventAt: string | null;
};

const STAGE_ORDER = [
  { key: "source_sync", label: "Source sync" },
  { key: "memory", label: "Memory" },
  { key: "experience", label: "Experience" },
  { key: "skill", label: "Skills" },
  { key: "governance", label: "Governance" },
  { key: "execution", label: "Execution" },
  { key: "learning", label: "Learning" },
  { key: "system", label: "System" },
] as const;

const KIND_LABELS: Record<string, string> = {
  source_synced: "Source synced",
  memory_extracted: "Memory extracted",
  experience_captured: "Experience captured",
  skill_candidate_generated: "Skill candidate",
  skill_approved: "Skill approved",
  agent_run_prepared: "Run prepared",
  agent_run_started: "Run started",
  agent_run_completed: "Run completed",
  outcome_recorded: "Outcome recorded",
  brief_ready: "Brief ready",
  governance_review_queued: "Governance queued",
  request_logged: "Request logged",
  timeline_updated: "Timeline updated",
  memory_processed: "Memory processed",
};

function initialState(): LoadState {
  return {
    projection: null,
    events: [],
    loading: true,
    online: false,
    error: null,
    lastEventKind: null,
    lastEventAt: null,
  };
}

function unwrapProjection(payload: unknown): MemoryRealtimeProjection | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { projection?: unknown; data?: { projection?: unknown } };
  const value = record.projection ?? record.data?.projection ?? null;
  if (!value || typeof value !== "object") return null;
  return value as MemoryRealtimeProjection;
}

function unwrapHistory(payload: unknown): MemoryRealtimeEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as { events?: unknown; data?: { events?: unknown } };
  const value = record.events ?? record.data?.events ?? [];
  return Array.isArray(value) ? (value as MemoryRealtimeEvent[]) : [];
}

function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(event: MemoryRealtimeEvent): string {
  return KIND_LABELS[event.kind] ?? event.kind.replaceAll("_", " ");
}

function stageLabel(stage: string): string {
  return STAGE_ORDER.find((item) => item.key === stage)?.label ?? stage.replaceAll("_", " ");
}

function drilldownForEvent(event: MemoryRealtimeEvent | null): MemoryDrilldown {
  if (!event) {
    return {
      title: "No event selected",
      description: "Select a recent event to inspect the underlying MemoryOS surface.",
      links: [
        { label: "Open Overview", href: "/mission-control", note: "Return to the main console workspace." },
      ],
    };
  }

  switch (event.kind) {
    case "source_synced":
    case "memory_extracted":
      return {
        title: "Source sync drilldown",
        description: "Inspect the connector feed, then jump into the Company Brain view that receives the extracted memory.",
        links: [
          { label: "Open Company Sources", href: consoleSectionHref("Company Sources"), note: "Check the live connector state." },
          { label: "Open Company Brain", href: consoleSectionHref("Company Brain"), note: "Review the structured memory graph." },
          { label: "Open Spine", href: "/continuity-lab/spine", note: "See how the memory feeds inheritance." },
        ],
      };
    case "experience_captured":
      return {
        title: "Experience drilldown",
        description: "A real outcome was captured as experience. Review it before it becomes a future-agent instruction.",
        links: [
          { label: "Open Experience", href: consoleSectionHref("Experience"), note: "Inspect the captured learning." },
          { label: "Open Spine", href: "/continuity-lab/spine", note: "See how experience flows into inheritance." },
        ],
      };
    case "skill_candidate_generated":
    case "skill_approved":
      return {
        title: "Skill drilldown",
        description: "This event is part of the experience-to-skill loop. Review the candidate or approved skill next.",
        links: [
          { label: "Inspect Skills", href: consoleSectionHref("Skills & Inheritance"), note: "Review the registry and inheritance proof." },
          { label: "Open Spine", href: "/continuity-lab/spine", note: "Check approved skills in the live loop." },
        ],
      };
    case "brief_ready":
    case "agent_run_prepared":
    case "agent_run_completed":
    case "outcome_recorded":
      return {
        title: "MemoryIgnition drilldown",
        description: "This event belongs to the prepare -> execute -> learn cycle. Open the brief and follow the outcome trail.",
        links: [
          { label: "Open MemoryIgnition", href: consoleSectionHref("MemoryIgnition"), note: "Inspect the inheritance package." },
          { label: "Open Approvals", href: consoleSectionHref("Approvals"), note: "Review any approval gates used in the run." },
        ],
      };
    case "governance_review_queued":
    case "timeline_updated":
      return {
        title: "Governance drilldown",
        description: "This event is part of the approval and audit trail. Use it to inspect the decision chain.",
        links: [
          { label: "Open Approvals", href: consoleSectionHref("Approvals"), note: "See the approval queue and audit proof." },
          { label: "Open Governance", href: consoleSectionHref("Approvals"), note: "Review policy and trust state." },
        ],
      };
    default:
      return {
        title: "Request drilldown",
        description: "This event reflects backend activity. Use it as a trace entry, then inspect the relevant console surface.",
        links: [
          { label: "Open Runtime Activity", href: consoleSectionHref("Agent Runtime"), note: "See the request timeline." },
          { label: "Open Overview", href: "/mission-control", note: "Return to the main dashboard." },
        ],
      };
  }
}

export function MemoryRealtimeLoopPanel({
  title = "Realtime loop",
  description = "Live source sync, memory, skills, governance, execution, and learning in one stream.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const [state, setState] = useState<LoadState>(initialState);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let source: EventSource | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void loadSnapshot();
      }, 300);
    };

    async function loadSnapshot() {
      try {
        const [projectionResponse, historyResponse] = await Promise.all([
          consoleApiFetch("/api/memory/events/projection"),
          consoleApiFetch("/api/memory/events/history?limit=8"),
        ]);
        const [projectionPayload, historyPayload] = await Promise.all([
          projectionResponse.json().catch(() => null),
          historyResponse.json().catch(() => null),
        ]);
        if (cancelled) return;
        const projection = unwrapProjection(projectionPayload);
        const events = unwrapHistory(historyPayload);
        setState((current) => ({
          ...current,
          projection,
          events,
          loading: false,
          error: null,
          lastEventKind: projection?.recentEvents?.[0]?.kind ?? current.lastEventKind,
          lastEventAt: projection?.latestEventAt ?? current.lastEventAt,
        }));
        const defaultSelectedEventId = projection?.recentEvents?.[0]?.id ?? events[0]?.id ?? null;
        setSelectedEventId((current) =>
          current && events.some((event) => event.id === current) ? current : defaultSelectedEventId,
        );
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Could not load realtime loop.",
        }));
      }
    }

    const connectStream = () => {
      if (cancelled || typeof EventSource === "undefined") return;
      try {
        source?.close();
        source = new EventSource("/api/memory/events");
        source.onopen = () => {
          setState((current) => ({ ...current, online: true }));
        };
        source.onmessage = (message) => {
          try {
            const payload = JSON.parse(message.data) as MemoryRealtimeEvent;
            if (!payload || typeof payload !== "object") return;
            setState((current) => ({
              ...current,
              lastEventKind: payload.kind ?? current.lastEventKind,
              lastEventAt: payload.occurredAt ?? new Date().toISOString(),
            }));
            scheduleRefresh();
          } catch {
            // Ignore malformed payloads and wait for the next event.
          }
        };
        source.onerror = () => {
          setState((current) => ({ ...current, online: false }));
          source?.close();
          source = null;
          if (reconnectTimer !== null) return;
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connectStream();
          }, 1800);
        };
      } catch {
        setState((current) => ({ ...current, online: false }));
      }
    };

    void loadSnapshot();
    connectStream();

    return () => {
      cancelled = true;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      source?.close();
    };
  }, []);

  const stageStats = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        ...stage,
        count: state.projection?.totalByStage?.[stage.key] ?? 0,
      })),
    [state.projection],
  );

  const totalEvents = state.projection?.totalEvents ?? 0;
  const recentEvents = state.projection?.recentEvents ?? state.events;
  const latestEvent = recentEvents[0] ?? null;
  const selectedEvent = recentEvents.find((event) => event.id === selectedEventId) ?? latestEvent;
  const drilldown = drilldownForEvent(selectedEvent);
  const live = state.online && !state.loading;

  return (
    <ConsoleSectionCard
      title={title}
      description={description}
      className={className}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <ConsoleStatusBadge label={live ? "Live" : "Reconnecting"} active={live} />
          <ConsoleStatusBadge label={state.error ? "Degraded" : "Healthy"} active={!state.error} />
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Last update {formatDateTime(state.projection?.updatedAt ?? state.lastEventAt)}</span>
          <span>{latestEvent ? `${eventLabel(latestEvent)} · ${stageLabel(latestEvent.stage)}` : "Waiting for events"}</span>
        </div>
      }
    >
      <div className="space-y-5">
        <ConsoleStatGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleStatCard
            label="Total events"
            value={String(totalEvents)}
            hint="Canonical events stored for replay and projection rebuilds."
          />
          <ConsoleStatCard
            label="Recent loop"
            value={latestEvent ? eventLabel(latestEvent) : "—"}
            hint={latestEvent ? `${stageLabel(latestEvent.stage)} at ${formatTime(latestEvent.occurredAt)}` : "No realtime activity yet."}
          />
          <ConsoleStatCard
            label="Stream state"
            value={state.online ? "Connected" : "Watching"}
            hint={state.error ?? "Listening to the backend event stream."}
          />
          <ConsoleStatCard
            label="Latest proof"
            value={state.projection?.latestEventAt ? formatTime(state.projection.latestEventAt) : "—"}
            hint="Most recent durable projection update."
          />
        </ConsoleStatGrid>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <ConsoleSectionCard
              title="Live stages"
              description="The live loop rendered as a single operating sequence."
              className="h-full"
            >
              <div className="flex flex-wrap gap-2">
                {stageStats.map((stage) => (
                  <span
                    key={stage.key}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs text-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    {stage.label}
                    <span className="text-muted-foreground">{stage.count}</span>
                  </span>
                ))}
              </div>
            </ConsoleSectionCard>

            <ConsoleSectionCard
              title="Latest events"
              description="Most recent semantic events from the canonical stream."
              className="h-full"
            >
              <div className="space-y-3">
                {recentEvents.length > 0 ? recentEvents.slice(0, 5).map((event) => {
                  const selected = event.id === selectedEventId;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={[
                        "w-full rounded-md border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/10",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{eventLabel(event)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.subject?.label ?? event.summary}
                          </p>
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {stageLabel(event.stage)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatDateTime(event.occurredAt)}</span>
                        <span>•</span>
                        <span>{event.subject?.type ?? "event"}</span>
                        {event.subject?.id ? (
                          <>
                            <span>•</span>
                            <span className="truncate">{event.subject.id}</span>
                          </>
                        ) : null}
                      </div>
                    </button>
                  );
                }) : (
                  <div className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                    Waiting for the next event to enter the loop.
                  </div>
                )}
              </div>
            </ConsoleSectionCard>
          </div>

          <ConsoleSectionCard
            title="Event inspector"
            description={drilldown.description}
            className="xl:sticky xl:top-4 self-start"
          >
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Selected event</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {selectedEvent ? eventLabel(selectedEvent) : "No event selected"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                {selectedEvent ? selectedEvent.summary : "Select an event from the list to inspect it."}
              </p>
            </div>

              {selectedEvent ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Kind</p>
                    <p className="mt-1 text-sm text-foreground">{selectedEvent.kind}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stage</p>
                    <p className="mt-1 text-sm text-foreground">{stageLabel(selectedEvent.stage)}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">At</p>
                    <p className="mt-1 text-sm text-foreground">{formatDateTime(selectedEvent.occurredAt)}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Subject</p>
                    <p className="mt-1 text-sm text-foreground">{selectedEvent.subject?.label ?? "—"}</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Open next</p>
                {drilldown.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-primary/40 hover:bg-muted/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{link.note}</p>
                    </div>
                    <ArrowRight className="mt-0.5 size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </ConsoleSectionCard>
        </div>
      </div>
    </ConsoleSectionCard>
  );
}
