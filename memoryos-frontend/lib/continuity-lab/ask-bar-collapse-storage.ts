"use client";

import { useCallback, useEffect, useState } from "react";

export type AskBarCollapseScope = "wiki" | "ask" | "global";

const STORAGE_PREFIX = "memoryos.continuity-lab.ask-bar.collapsed.";

function storageKey(scope: AskBarCollapseScope): string {
  return `${STORAGE_PREFIX}${scope}`;
}

export function readAskBarCollapsed(scope: AskBarCollapseScope): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(storageKey(scope)) === "1";
  } catch {
    return false;
  }
}

export function saveAskBarCollapsed(scope: AskBarCollapseScope, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(scope), collapsed ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

export function useAskBarCollapsed(scope: AskBarCollapseScope = "global") {
  const [collapsed, setCollapsedState] = useState(() => readAskBarCollapsed(scope));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCollapsedState(readAskBarCollapsed(scope));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [scope]);

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      saveAskBarCollapsed(scope, value);
    },
    [scope],
  );

  return { collapsed, setCollapsed, hydrated };
}
