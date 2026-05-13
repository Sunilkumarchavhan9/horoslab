"use client";

import { useEffect, useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";

type FlightRecorderSectionProps = {
  requestEvents: RequestSectionEvent[];
};

export function FlightRecorderSection({ requestEvents }: FlightRecorderSectionProps) {
  const [liveEvents, setLiveEvents] = useState<RequestSectionEvent[]>(requestEvents);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const deduped = Array.from(
      new Map(
        requestEvents
          .filter((item) => item && typeof item.id === "string")
          .map((item) => [item.id, item]),
      ).values(),
    ) as RequestSectionEvent[];
    deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLiveEvents(deduped);
    setLoading(false);
  }, [requestEvents]);

  const timeline = useMemo(() => {
    return liveEvents.slice(0, 16);
  }, [liveEvents]);

  return (
    <section>
      <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Agent Flight Recorder</h1>
      <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
        Timeline of memory calls and workflow transitions.
      </p>

      <div className="mt-4 rounded-[10px] border border-border bg-muted p-4">
        <div className="space-y-2">
          {(timeline.length > 0 ? timeline : []).map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-[8px] border border-border bg-muted px-3 py-2 text-[12px]">
              <span className="text-muted-foreground">
                {new Date(event.createdAt).toLocaleTimeString()} · {event.method} {event.route}
              </span>
              <span className="text-muted-foreground">{event.latencyMs}ms · {event.statusCode}</span>
            </div>
          ))}
          {loading && timeline.length === 0 ? (
            <div className="rounded-[8px] border border-border bg-muted px-3 py-4 text-[12px] text-muted-foreground">
              Loading recorder events...
            </div>
          ) : null}
          {!loading && timeline.length === 0 ? (
            <div className="rounded-[8px] border border-border bg-muted px-3 py-4 text-[12px] text-muted-foreground">
              No sessions yet. Start a continuity run to populate recorder events.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
