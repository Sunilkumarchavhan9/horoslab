"use client";

import { useEffect, useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import {
  Badge,
  Button,
  ConsoleAlert,
  ConsolePage,
  ConsolePageHeader,
  ConsoleSectionCard,
} from "@/components/developer-console/console-ui";
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

export function ConflictStalenessSection({ requestEvents, openLoops }: ConflictStalenessSectionProps) {
  const errors = useMemo(
    () =>
      Array.from(
        new Map(
          requestEvents
            .filter((event) => event.status === "Error")
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
        .map((item) => formatMemoryForDisplay(item))
        .filter(Boolean),
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
    }, 10000);
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
        description="Open loops, runtime errors, and memory conflicts that need resolution."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue()}>
            Refresh queue
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ConsoleSectionCard title="Open loops" description="Unresolved continuity items from live workspace data.">
          <ul className="space-y-2">
            {(formattedOpenLoops.length > 0 ? formattedOpenLoops : ["No open loops detected"]).map(
              (item, index) => (
                <li
                  key={`open-loop-${index}-${item.slice(0, 24)}`}
                  className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-sm leading-relaxed text-foreground"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </ConsoleSectionCard>

        <ConsoleSectionCard title="Recent errors" description="Latest failed API calls in this workspace.">
          <ul className="space-y-2">
            {(errors.length > 0
              ? errors.map((e) => `${e.method} ${e.route}`)
              : ["No runtime conflicts detected"]
            ).map((item, index) => (
              <li
                key={`runtime-error-${index}-${item}`}
                className="keep-mono rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </ConsoleSectionCard>
      </div>

      <ConsoleSectionCard
        title="Conflict queue"
        description="Memories flagged as conflicting — choose how to resolve each item."
      >
        {queueError ? <ConsoleAlert className="mb-3">{queueError}</ConsoleAlert> : null}
        {loadingQueue && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading conflict queue…</p>
        ) : null}
        {items.length === 0 && !loadingQueue ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No open conflicts detected.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/80 bg-card/50 p-4"
              >
                <p className="text-sm leading-relaxed text-foreground">
                  {formatMemoryForDisplay(item.reason) || item.reason}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={severityVariant(item.severity)} className="capitalize">
                    {item.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Confidence {(item.confidence * 100).toFixed(0)}%
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
