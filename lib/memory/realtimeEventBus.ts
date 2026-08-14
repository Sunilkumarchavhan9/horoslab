import type { Response as ExpressResponse } from "express";
import { appendMemoryRealtimeEvent, normalizeMemoryRealtimeEvent } from "./realtimeEventStore";
import type { MemoryRealtimeEventInput } from "./types";

const MEMORY_STREAMS = new Map<string, Set<ExpressResponse>>();

export function registerMemoryRealtimeSink(userId: string, res: ExpressResponse): () => void {
  const sinks = MEMORY_STREAMS.get(userId) ?? new Set<ExpressResponse>();
  sinks.add(res);
  MEMORY_STREAMS.set(userId, sinks);
  return () => {
    const current = MEMORY_STREAMS.get(userId);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) MEMORY_STREAMS.delete(userId);
  };
}

export function emitMemoryRealtimeEvent(event: MemoryRealtimeEventInput): void {
  const normalizedEvent = normalizeMemoryRealtimeEvent(event);
  void appendMemoryRealtimeEvent(normalizedEvent).catch(() => {
    // Realtime updates must not fail the originating request.
  });

  const sinks = MEMORY_STREAMS.get(normalizedEvent.userId);
  if (!sinks || sinks.size === 0) return;
  const line = `data: ${JSON.stringify(normalizedEvent)}\n\n`;
  for (const res of sinks) {
    try {
      res.write(line);
    } catch {
      // Stale connections are removed by the close handler.
    }
  }
}
