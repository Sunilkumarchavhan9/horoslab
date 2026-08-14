"use client";

import { useEffect, useState } from "react";
import { getEpochProductionIntelligence, type EpochProductionIntelligence } from "@/lib/epoch-api";

const EMPTY: EpochProductionIntelligence = {
  interactions: [], signals: [], clusters: [], rootCauses: [], evaluations: [],
  replays: [], fixes: [], reliability: [], improvements: [],
};

export function useProductionIntelligence(workspaceId?: string | null): EpochProductionIntelligence {
  const [data, setData] = useState<EpochProductionIntelligence>(EMPTY);

  useEffect(() => {
    if (!workspaceId) {
      setData(EMPTY);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const next = await getEpochProductionIntelligence(workspaceId);
        const payload = next as Partial<EpochProductionIntelligence>;
        if (!cancelled) {
          setData({
            interactions: Array.isArray(payload.interactions) ? payload.interactions : [],
            signals: Array.isArray(payload.signals) ? payload.signals : [],
            clusters: Array.isArray(payload.clusters) ? payload.clusters : [],
            rootCauses: Array.isArray(payload.rootCauses) ? payload.rootCauses : [],
            evaluations: Array.isArray(payload.evaluations) ? payload.evaluations : [],
            replays: Array.isArray(payload.replays) ? payload.replays : [],
            fixes: Array.isArray(payload.fixes) ? payload.fixes : [],
            reliability: Array.isArray(payload.reliability) ? payload.reliability : [],
            improvements: Array.isArray(payload.improvements) ? payload.improvements : [],
          });
        }
      } catch {
        if (!cancelled) setData(EMPTY);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [workspaceId]);

  return data;
}
