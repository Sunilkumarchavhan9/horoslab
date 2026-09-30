"use client";

import { useEffect, useState } from "react";
import { getDhyraAiExecutionOverview, type DhyraAiExecutionOverview } from "@/lib/dhyra-api";

const EMPTY: DhyraAiExecutionOverview = { catalog: [], endpoints: [], health: [], providerHealth: [], executions: [], costs: {} };

export function useAiExecutionOverview(workspaceId?: string | null): DhyraAiExecutionOverview {
  const [overview, setOverview] = useState<DhyraAiExecutionOverview>(EMPTY);
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    const load = () => getDhyraAiExecutionOverview(workspaceId).then((next) => {
      if (!cancelled) {
        setOverview({
          catalog: Array.isArray(next.catalog) ? next.catalog : [],
          endpoints: Array.isArray(next.endpoints) ? next.endpoints : [],
          health: Array.isArray(next.health) ? next.health : [],
          providerHealth: Array.isArray(next.providerHealth) ? next.providerHealth : [],
          executions: Array.isArray(next.executions) ? next.executions : [],
          costs: next.costs && typeof next.costs === "object" ? next.costs : {},
        });
      }
    }).catch(() => undefined);
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [workspaceId]);
  return overview;
}
