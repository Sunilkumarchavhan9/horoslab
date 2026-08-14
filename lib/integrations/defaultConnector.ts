import type { ConnectorType } from "./connectorManager";

export const DEFAULT_MEMORY_PIPELINE_CONNECTOR: ConnectorType = "github";

export function prioritizeDefaultConnector<T extends { type: string }>(
  connectors: readonly T[],
): T[] {
  return [...connectors].sort((a, b) => {
    const aIsDefault = a.type === DEFAULT_MEMORY_PIPELINE_CONNECTOR;
    const bIsDefault = b.type === DEFAULT_MEMORY_PIPELINE_CONNECTOR;
    if (aIsDefault === bIsDefault) return 0;
    return aIsDefault ? -1 : 1;
  });
}
