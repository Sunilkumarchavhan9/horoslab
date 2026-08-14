import type { RealityEvent } from "../models/RealityTypes";

export interface EventRepository {
  replace(events: RealityEvent[]): void;
  reset(): void;
  save(event: RealityEvent): RealityEvent;
  list(): RealityEvent[];
  count(): number;
  latest(): RealityEvent | null;
}
