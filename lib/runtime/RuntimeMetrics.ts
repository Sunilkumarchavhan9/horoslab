import type { RuntimeBus, RuntimeBusMetrics, RuntimeEvent } from "./RuntimeBus";

export interface RuntimeMetrics {
  snapshot(): RuntimeBusMetrics;
}

export function createRuntimeMetrics<TEvent extends RuntimeEvent>(
  bus: RuntimeBus<TEvent>,
): RuntimeMetrics {
  return {
    snapshot: () => bus.metrics(),
  };
}
