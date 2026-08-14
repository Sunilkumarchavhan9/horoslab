"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MCP_CATALOG_CHANGED_EVENT,
  MCP_CATALOG_STORAGE_KEY,
  readMcpCatalog,
  type McpCatalogEntry,
  type McpCatalogState,
} from "@/lib/continuity-lab/mcp-catalog-storage";

export function useMcpCatalog() {
  const [state, setState] = useState<McpCatalogState>(() => readMcpCatalog());

  const refresh = useCallback(() => {
    setState(readMcpCatalog());
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === MCP_CATALOG_STORAGE_KEY) refresh();
    }
    function onCatalogChanged() {
      refresh();
    }
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(MCP_CATALOG_CHANGED_EVENT, onCatalogChanged);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MCP_CATALOG_CHANGED_EVENT, onCatalogChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const entries = state.entries;
  const installedCount = useMemo(
    () => entries.filter((entry) => entry.installed).length,
    [entries],
  );

  return {
    entries,
    totalCount: entries.length,
    installedCount,
    refresh,
    setEntries: (next: McpCatalogEntry[]) => {
      setState((prev) => ({ ...prev, entries: next }));
    },
  };
}
