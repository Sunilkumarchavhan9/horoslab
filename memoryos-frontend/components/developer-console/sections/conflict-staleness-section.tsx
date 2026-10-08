"use client";

import { useEffect, useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import {
  Badge,
  Button,
  ConsoleAlert,
  ConsoleEmptyState,
  ConsoleGrid,
  ConsolePage,
  ConsolePageHeader,
  ConsoleSectionCard,
  ConsoleStatCard,
  ConsoleStatGrid,
} from "@/components/horos/console-ui";
import { formatMemoryForDisplay } from "@/lib/memory-display-text";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type ConflictStalenessSectionProps = {
  requestEvents: RequestSectionEvent[];
  openLoops: string[];
};

type ConflictQueueItem = {
  id: string;
  memoryId: string;
  conflictingWithMemoryId: string;
  severity: "low" | "medium" | "high";
  reason: string;
  suggestedAction: "replace" | "merge" | "pin_old" | "deprecate";
  confidence: number;
};

function severityVariant(severity: ConflictQueueItem["severity"]) {
  if (severity === "high") return "destructive" as const;
  if (severity === "medium") return "outline" as const;
  return "secondary" as const;
}

function sanitizeRoute(route: string): string {
  try {
    const [pathname, query = ""] = route.split("?");
    if (!query) return pathname || route;
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
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  } catch {
    return route.replace(/([?&](?:token|secret|key|code)=)[^&]+/gi, "$1[redacted]");
  }
}

function isRealtimeNoise(route: string): boolean {
  const pathname = route.split("?")[0]?.toLowerCase() ?? route.toLowerCase();
  return pathname.endsWith("/api/memory/events") || pathname.endsWith("/api/connector/events");
}

function compactText(value: string, maxLength = 220): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function loopTitle(value: string): string {
  const clean = formatMemoryForDisplay(value) || value;
  const match =
    clean.match(/Continue from:\s*([^#]+)/i) ??
    clean.match(/Open loop:\s*([^#]+)/i) ??
    clean.match(/Next action:\s*([^#]+)/i);
  if (match?.[1]) return compactText(match[1], 96);
  return compactText(clean, 96);
}

function loopReason(value: string): string {
  const clean = formatMemoryForDisplay(value) || value;
  if (/continue from/i.test(clean)) {
    return "Continuation needed before this context is safe for another agent.";
  }
  if (/risk|fix|bug|incident/i.test(clean)) {
    return "Potential stale or risky context that should be reviewed before reuse.";
  }
  return compactText(clean, 170);
}

function errorTitle(event: RequestSectionEvent): string {
  const route = sanitizeRoute(event.route).split("?")[0] || event.route;
  if (event.statusCode === 429) return "Rate limit protection triggered";
  if (event.statusCode >= 500) return "Backend runtime failure";
  if (route.includes("/conflicts")) return "Conflict queue request failed";
  if (route.includes("/benchmarks")) return "Benchmark request failed";
  if (route.includes("/memory")) return "Memory API request failed";
  return "Runtime request failed";
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ConflictStalenessSection({ requestEvents, openLoops }: ConflictStalenessSectionProps) {
  const errors = useMemo(
    () =>
      Array.from(
        new Map(
          requestEvents
            .filter((event) => event.status === "Error" && !isRealtimeNoise(event.route))
            .map((event) => [event.id, event]),
        ).values(),
      )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [requestEvents],
  );

  const formattedOpenLoops = useMemo(
    () =>
      Array.from(new Set(openLoops.map((item) => item.trim()).filter(Boolean)))
        .map((item) => ({
          raw: item,
          title: loopTitle(item),
          reason: loopReason(item),
        }))
        .filter((item) => item.title),
    [openLoops],
  );

  const [items, setItems] = useState<ConflictQueueItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  async function loadQueue(): Promise<void> {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setQueueError("Missing auth token. Sign in again.");
      return;
    }
    setLoadingQueue(true);
    try {
      const response = await fetch("/api/memory/conflicts/queue?state=open", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        setQueueError(`Queue fetch failed (${response.status})`);
        return;
      }
      const payload = (await response.json()) as {
        items?: unknown[];
        data?: { items?: unknown[] };
      };
      const nextItems: unknown[] = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];
      const deduped: ConflictQueueItem[] = Array.from(
        new Map(
          nextItems
            .filter(
              (item): item is ConflictQueueItem =>
                typeof item === "object" &&
                item !== null &&
                "id" in item &&
                typeof (item as { id?: unknown }).id === "string",
            )
            .map((item) => [item.id, item]),
        ).values(),
      );
      setItems(deduped);
      setQueueError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Network error while loading conflict queue";
      setQueueError(message);
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    void loadQueue();
    const timer = window.setInterval(() => {
      void loadQueue();
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function resolveItem(
    queueItemId: string,
    action: "replace" | "merge" | "pin_old" | "deprecate",
  ): Promise<void> {
    const token = await getOrCreateMemoryToken();
    if (!token) return;
    setBusyId(queueItemId);
    try {
      const response = await fetch("/api/memory/conflicts/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ queueItemId, action }),
      });
      if (response.ok) {
        await loadQueue();
      } else {
        setQueueError(`Resolve failed (${response.status})`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Network error while resolving conflict";
      setQueueError(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ConsolePage>
      <ConsolePageHeader
        title="Conflict & Staleness"
        description="Resolution control for stale context, open loops, failed runtime calls, and memory conflicts before agents reuse them."
        badge={
          <Badge variant={items.length > 0 || errors.length > 0 ? "destructive" : "secondary"}>
            {items.length > 0 || errors.length > 0 ? "review needed" : "healthy"}
          </Badge>
        }
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue()}>
            Refresh resolution queue
          </Button>
        }
      />

      <ConsoleStatGrid className="lg:grid-cols-4 xl:grid-cols-4">
        <ConsoleStatCard
          label="Open loops"
          value={formattedOpenLoops.length}
          hint="continuity items waiting"
        />
        <ConsoleStatCard
          label="Conflict queue"
          value={items.length}
          hint={items.length > 0 ? "needs decision" : "all clear"}
        />
        <ConsoleStatCard
          label="Runtime errors"
          value={errors.length}
          hint="token-safe filtered"
        />
        <ConsoleStatCard
          label="Queue status"
          value={loadingQueue ? "Syncing" : "Ready"}
          hint={queueError ? "needs attention" : "backend connected"}
        />
      </ConsoleStatGrid>

      <ConsoleGrid columns="two" className="items-start">
        <ConsoleSectionCard
          title="Open loop resolution"
          description="Unresolved continuity items from live workspace memory, summarized for engineer review."
        >
          {formattedOpenLoops.length === 0 ? (
            <ConsoleEmptyState
              title="No open loops detected"
              description="MemoryOS has not found unresolved continuity items in the current workspace."
            />
          ) : (
            <div className="space-y-3">
              {formattedOpenLoops.slice(0, 8).map((item, index) => (
                <article
                  key={`open-loop-${index}-${item.raw.slice(0, 24)}`}
                  className="border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Open loop {index + 1}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold leading-6 text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <Badge variant="outline">needs owner</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.reason}
                  </p>
                </article>
              ))}
            </div>
          )}
        </ConsoleSectionCard>

        <ConsoleSectionCard
          title="Runtime attention"
          description="Latest failed API calls, filtered to hide stream heartbeats and auth tokens."
        >
          {errors.length === 0 ? (
            <ConsoleEmptyState
              title="No actionable runtime errors"
              description="Realtime stream noise and token URLs are hidden from this queue."
            />
          ) : (
            <div className="space-y-3">
              {errors.map((event) => (
                <article key={event.id} className="border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {errorTitle(event)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(event.createdAt)} · HTTP {event.statusCode} · {event.latencyMs}ms
                      </p>
                    </div>
                    <Badge variant={event.statusCode >= 500 ? "destructive" : "outline"}>
                      {event.statusCode === 429 ? "cooldown" : "review"}
                    </Badge>
                  </div>
                  <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
                    {event.method} {sanitizeRoute(event.route)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </ConsoleSectionCard>
      </ConsoleGrid>

      <ConsoleSectionCard
        title="Memory conflict queue"
        description="Backend-detected conflicts that need a human decision before they become reusable agent context."
      >
        {queueError ? <ConsoleAlert className="mb-3">{queueError}</ConsoleAlert> : null}
        {loadingQueue && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading conflict queue…</p>
        ) : null}
        {items.length === 0 && !loadingQueue ? (
          <ConsoleEmptyState
            title="No memory conflicts detected"
            description="The conflict queue is clear. New conflicts will appear here when MemoryOS detects competing facts or stale decisions."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Suggested action · {item.suggestedAction.replace("_", " ")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {compactText(formatMemoryForDisplay(item.reason) || item.reason, 260)}
                    </p>
                  </div>
                  <Badge variant={severityVariant(item.severity)} className="capitalize">
                    {item.severity} severity
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Confidence {(item.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Memory {item.memoryId.slice(0, 8)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Conflicts with {item.conflictingWithMemoryId.slice(0, 8)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["replace", "merge", "pin_old", "deprecate"] as const).map((action) => (
                    <Button
                      key={action}
                      type="button"
                      size="sm"
                      variant={action === item.suggestedAction ? "default" : "outline"}
                      disabled={busyId === item.id}
                      onClick={() => void resolveItem(item.id, action)}
                    >
                      {busyId === item.id ? "…" : action.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ConsoleSectionCard>
    </ConsolePage>
  );
}

