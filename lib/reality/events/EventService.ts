import { randomUUID } from "node:crypto";
import type { RealityEvent } from "../models/RealityTypes";
import type { EventRepository } from "../repositories/EventRepository";
import { createMemoryEventRepository } from "../repositories/memory/InMemoryEventRepository";

export interface RealityEventFilter {
  nodeId?: string;
  type?: string;
  source?: string;
  since?: string;
  until?: string;
}

export interface RealityEventSnapshot {
  total: number;
  latestAt: string | null;
  countsByType: Record<string, number>;
  countsBySource: Record<string, number>;
}

export type RealityEventListener = (event: RealityEvent) => void;

function nowIso(): string {
  return new Date().toISOString();
}

function cloneEvent(event: RealityEvent): RealityEvent {
  return {
    ...event,
    payload: { ...event.payload },
  };
}

function matchesFilter(event: RealityEvent, filter: RealityEventFilter): boolean {
  if (filter.nodeId && event.nodeId !== filter.nodeId) return false;
  if (filter.type && event.type !== filter.type) return false;
  if (filter.source && event.source !== filter.source) return false;
  if (filter.since && event.timestamp < filter.since) return false;
  if (filter.until && event.timestamp > filter.until) return false;
  return true;
}

export class EventService {
  private readonly listeners: Set<{
    listener: RealityEventListener;
    filter: RealityEventFilter;
  }>;

  constructor(private readonly repository: EventRepository = createMemoryEventRepository()) {
    this.listeners = new Set();
  }

  reset(): void {
    this.repository.reset();
    this.listeners.clear();
  }

  publish(event: RealityEvent): RealityEvent {
    const normalized = this.repository.save(cloneEvent(event));
    for (const entry of this.listeners) {
      if (matchesFilter(normalized, entry.filter)) {
        entry.listener(cloneEvent(normalized));
      }
    }
    return cloneEvent(normalized);
  }

  append(input: {
    nodeId: string;
    type: string;
    payload?: Record<string, unknown>;
    source?: string;
  }): RealityEvent {
    return this.publish({
      id: `event-${randomUUID()}`,
      nodeId: input.nodeId,
      type: input.type,
      payload: input.payload ?? {},
      source: input.source ?? "system",
      timestamp: nowIso(),
    });
  }

  list(limit = 100): RealityEvent[] {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 100;
    return this.repository.list().slice(0, normalizedLimit).map(cloneEvent);
  }

  replay(filter: RealityEventFilter = {}): RealityEvent[] {
    return this.repository
      .list()
      .filter((event) => matchesFilter(event, filter))
      .slice()
      .reverse()
      .map(cloneEvent);
  }

  subscribe(listener: RealityEventListener, filter: RealityEventFilter = {}): () => void {
    const entry = { listener, filter };
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  }

  count(): number {
    return this.repository.count();
  }

  latest(): RealityEvent | null {
    const latest = this.repository.latest();
    return latest ? cloneEvent(latest) : null;
  }

  snapshot(): RealityEventSnapshot {
    const events = this.repository.list();
    const countsByType = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});
    const countsBySource = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.source] = (acc[event.source] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: events.length,
      latestAt: events[0]?.timestamp ?? null,
      countsByType,
      countsBySource,
    };
  }
}
