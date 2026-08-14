import type { RealityEvent } from "../../models/RealityTypes";
import type { EventRepository } from "../EventRepository";

function cloneEvent(event: RealityEvent): RealityEvent {
  return {
    ...event,
    payload: { ...event.payload },
  };
}

export class InMemoryEventRepository implements EventRepository {
  private seedEvents: RealityEvent[];

  private events: RealityEvent[];

  constructor(seedEvents: RealityEvent[]) {
    this.seedEvents = seedEvents.map(cloneEvent);
    this.events = seedEvents.map(cloneEvent);
  }

  replace(events: RealityEvent[]): void {
    this.seedEvents = events.map(cloneEvent);
    this.events = events.map(cloneEvent);
  }

  reset(): void {
    this.events = this.seedEvents.map(cloneEvent);
  }

  save(event: RealityEvent): RealityEvent {
    const stored = cloneEvent(event);
    this.events.unshift(stored);
    return cloneEvent(stored);
  }

  list(): RealityEvent[] {
    return this.events.map(cloneEvent);
  }

  count(): number {
    return this.events.length;
  }

  latest(): RealityEvent | null {
    return this.events[0] ? cloneEvent(this.events[0]) : null;
  }
}

export function createMemoryEventRepository(): EventRepository {
  return new InMemoryEventRepository([
    {
      id: "event-reality-online",
      nodeId: "reality-fabric",
      type: "reality_bootstrapped",
      payload: {
        message: "Reality Fabric backend seeded and ready.",
      },
      source: "system",
      timestamp: "2026-07-27T00:00:00.000Z",
    },
  ]);
}
