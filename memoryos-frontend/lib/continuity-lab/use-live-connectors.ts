"use client";

import { useCallback, useEffect, useState } from "react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  connectorStatus,
  fetchConnectorList,
  isConnectorConnected,
  type ConnectorListRow,
} from "@/lib/continuity-lab/connector-list";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import type { MemoryOsConnectorState } from "@/lib/continuity-lab/runtime";

export type IntegrationRowLike = {
  id: string;
  connectorType?: string;
  stub?: boolean;
};

export function isIntegrationConnected(
  row: IntegrationRowLike,
  list: ConnectorListRow[],
  github: MemoryOsConnectorState["payload"]["github"],
): boolean {
  if (row.stub) return false;
  if (row.id === "github") {
    return (
      github.connected || isConnectorConnected(connectorStatus(list, "github"))
    );
  }
  if (row.connectorType) {
    return isConnectorConnected(connectorStatus(list, row.connectorType));
  }
  return false;
}

export function useLiveConnectors() {
  const { connector, refresh } = useContinuityLab();
  const [list, setList] = useState<ConnectorListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadList = useCallback(async () => {
    const next = await fetchConnectorList();
    setList(next);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    await Promise.all([reloadList(), refresh()]);
    setLoading(false);
  }, [reloadList, refresh]);

  useEffect(() => {
    void reload();
  }, [
    reload,
    connector.payload.github.connected,
    connector.payload.github.status,
  ]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let closed = false;
    let debounce: number | null = null;

    async function connectEventStream() {
      const token = await getOrCreateMemoryToken();
      if (!token || closed) return;
      eventSource = new EventSource(
        `/api/connector/events?token=${encodeURIComponent(token)}`,
      );
      eventSource.onmessage = () => {
        if (debounce) window.clearTimeout(debounce);
        debounce = window.setTimeout(() => void reload(), 800);
      };
      eventSource.onerror = () => {
        eventSource?.close();
        if (!closed) window.setTimeout(() => void connectEventStream(), 15_000);
      };
    }

    void connectEventStream();
    return () => {
      closed = true;
      if (debounce) window.clearTimeout(debounce);
      eventSource?.close();
    };
  }, [reload]);

  return {
    list,
    loading,
    reload,
    github: connector.payload.github,
  };
}
