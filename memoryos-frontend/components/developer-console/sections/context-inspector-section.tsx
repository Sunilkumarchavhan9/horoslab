"use client";

import { useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { StructuredDataPanel } from "./_shared/structured-data-panel";

type ContextInspectorSectionProps = {
  requestEvents: RequestSectionEvent[];
};

export function ContextInspectorSection({ requestEvents }: ContextInspectorSectionProps) {
  const liveEvents = useMemo(() => {
    const deduped = Array.from(
      new Map(
        requestEvents
          .filter((item) => item && typeof item.id === "string")
          .map((item) => [item.id, item]),
      ).values(),
    ) as RequestSectionEvent[];
    deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deduped;
  }, [requestEvents]);

  const last = liveEvents[0];
  const previous = liveEvents[1];
  const [status, setStatus] = useState("");

  const latestPayload = useMemo(
    () => ({
      id: last?.id ?? null,
      route: last?.route ?? null,
      method: last?.method ?? null,
      status: last?.status ?? null,
      statusCode: last?.statusCode ?? null,
      latencyMs: last?.latencyMs ?? null,
      agent: last?.agent ?? null,
      payloadSummary: last?.payloadSummary ?? null,
      responseSummary: last?.responseSummary ?? null,
      errorDetails: last?.errorDetails ?? null,
    }),
    [last],
  );

  const previousPayload = useMemo(
    () => ({
      id: previous?.id ?? null,
      route: previous?.route ?? null,
      method: previous?.method ?? null,
      status: previous?.status ?? null,
      statusCode: previous?.statusCode ?? null,
      latencyMs: previous?.latencyMs ?? null,
      agent: previous?.agent ?? null,
      payloadSummary: previous?.payloadSummary ?? null,
      responseSummary: previous?.responseSummary ?? null,
      errorDetails: previous?.errorDetails ?? null,
    }),
    [previous],
  );

  const diffLines = useMemo(() => {
    const keys = Object.keys(latestPayload) as Array<keyof typeof latestPayload>;
    return keys
      .map((key) => {
        const a = latestPayload[key];
        const b = previousPayload[key];
        if (JSON.stringify(a) === JSON.stringify(b)) return null;
        return `${String(key)}:\n  prev=${JSON.stringify(b)}\n  next=${JSON.stringify(a)}`;
      })
      .filter((item): item is string => Boolean(item));
  }, [latestPayload, previousPayload]);

  const traceMeta = useMemo(() => {
    const payloadText = JSON.stringify(latestPayload);
    return {
      traceId: last?.id ?? "-",
      payloadSizeBytes: payloadText.length,
      memoryUsedCount: (() => {
        const text = `${last?.payloadSummary ?? ""} ${last?.responseSummary ?? ""}`.toLowerCase();
        const match = text.match(/memory|memories/g);
        return match ? match.length : 0;
      })(),
      retrievalConfidence: (() => {
        const text = `${last?.responseSummary ?? ""}`.toLowerCase();
        const match = text.match(/confidence[:=\s]+(\d+(?:\.\d+)?)/);
        return match?.[1] ? Number(match[1]) : null;
      })(),
    };
  }, [last, latestPayload]);

  async function copy(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      setStatus(`${label} copy failed`);
    }
  }

  return (
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Context Inspector</h1>
      {status ? <p className="mt-2 text-[11px] text-muted-foreground">{status}</p> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Injected Payload</p>
            <button
              type="button"
              onClick={() => void copy(JSON.stringify(latestPayload, null, 2), "Payload JSON")}
              className="rounded-[6px] border border-border px-2 py-1 text-[10px] text-foreground"
            >
              Copy JSON
            </button>
          </div>
          <div className="mt-2">
            <StructuredDataPanel title="Latest payload" value={latestPayload} maxHeightClassName="max-h-72" />
          </div>
        </div>

        <div className="rounded-[10px] border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Previous Diff</p>
            <button
              type="button"
              onClick={() => void copy(diffLines.join("\n\n"), "Diff")}
              className="rounded-[6px] border border-border px-2 py-1 text-[10px] text-foreground"
            >
              Copy Diff
            </button>
          </div>
          <div className="mt-2">
            <StructuredDataPanel
              title="Payload diff"
              value={diffLines.length > 0 ? diffLines.join("\n\n") : "No change from previous request."}
              maxHeightClassName="max-h-72"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Trace Metadata</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["trace id", traceMeta.traceId],
            ["payload size", `${traceMeta.payloadSizeBytes} bytes`],
            ["memory used count", `${traceMeta.memoryUsedCount}`],
            [
              "retrieval confidence",
              traceMeta.retrievalConfidence !== null ? `${traceMeta.retrievalConfidence}` : "n/a",
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[8px] border border-border bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-[12px] text-foreground">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
