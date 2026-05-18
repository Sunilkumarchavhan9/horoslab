"use client";

import { useEffect, useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
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

function cleanTraceText(input: string): string {
  if (!input) return "";
  return input
    .replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "")
    .replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "")
    .replace(/,\s*"expected"\s*:\s*\{[^}]*\}/g, "")
    .replace(/"text"\s*:\s*/g, "")
    .replace(/[\[\]\{\}"]/g, "")
    .replace(/\s*,\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
  const dedupedOpenLoops = useMemo(
    () => Array.from(new Set(openLoops.map((item) => item.trim()).filter(Boolean))),
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

  async function resolveItem(queueItemId: string, action: "replace" | "merge" | "pin_old" | "deprecate"): Promise<void> {
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
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Conflict &amp; Staleness</h1>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Open Loops</p>
          <ul className="mt-2 space-y-2 text-[13px] text-foreground">
            {(dedupedOpenLoops.length > 0 ? dedupedOpenLoops : ["No open loops detected"]).map((item, index) => (
              <li key={`open-loop-${index}-${item}`} className="rounded-[6px] border border-border bg-muted px-3 py-2">{cleanTraceText(item)}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Recent Errors</p>
          <ul className="mt-2 space-y-2 text-[13px] text-foreground">
            {(errors.length > 0 ? errors.map((e) => `${e.method} ${e.route}`) : ["No runtime conflicts detected"]).map((item, index) => (
              <li key={`runtime-error-${index}-${item}`} className="rounded-[6px] border border-border bg-muted px-3 py-2">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Conflict Queue</p>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="rounded-[6px] border border-border px-2 py-1 text-[10px] text-muted-foreground"
          >
            Refresh
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {queueError ? (
            <div className="rounded-[6px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {queueError}
            </div>
          ) : null}
          {loadingQueue && items.length === 0 ? (
            <div className="rounded-[6px] border border-border bg-muted px-3 py-2 text-[12px] text-muted-foreground">
              Loading conflict queue...
            </div>
          ) : null}
          {items.length === 0 ? (
            <div className="rounded-[6px] border border-border bg-muted px-3 py-2 text-[12px] text-muted-foreground">
              No open conflicts detected.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-border bg-muted px-3 py-3">
                <p className="text-[12px] text-foreground">
                  {item.reason}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  severity={item.severity} confidence={(item.confidence * 100).toFixed(0)}%
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["replace", "merge", "pin_old", "deprecate"] as const).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void resolveItem(item.id, action)}
                      className={`rounded-[6px] border px-2 py-1 text-[10px] ${
                        action === item.suggestedAction
                          ? "border-primary/50 text-primary"
                          : "border-border text-muted-foreground"
                      } disabled:opacity-50`}
                    >
                      {busyId === item.id ? "..." : action}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
