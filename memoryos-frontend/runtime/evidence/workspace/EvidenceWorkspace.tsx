"use client";

import React, { useEffect } from "react";
import { useEvidenceStore } from "../store";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { useMissionRuntimeData } from "../../missions/runtime/mission-runtime-data";

// We will build these next
import { EvidenceArtifactsView } from "../perspectives/artifacts/EvidenceArtifactsView";
import { EvidenceLogsView } from "../perspectives/logs/EvidenceLogsView";
import { EvidenceClaimsView } from "../perspectives/claims/EvidenceClaimsView";
import { EvidenceDecisionsView } from "../perspectives/decisions/EvidenceDecisionsView";

export function EvidenceWorkspace({ activeSection }: { activeSection: string }) {
  const { currentView, setView } = useEvidenceStore();
  const { missions, loading, error } = useMissionRuntimeData();
  const evidenceCount = missions.reduce((total, mission) => total + (mission.evidence?.length ?? 0), 0);
  const verifiedCount = missions.filter((mission) => Boolean(mission.verificationRun)).length;
  const decisionCount = missions.filter((mission) => Boolean(mission.verificationRun?.finalDecision)).length;

  useEffect(() => {
    if (activeSection.startsWith("evidence-")) {
      const viewName = activeSection.replace("evidence-", "");
      setView(viewName);
    }
  }, [activeSection, setView]);

  return (
    <div className="flex flex-col w-full h-full bg-background font-sans overflow-hidden border border-border rounded-sm shadow-sm">
      
      {/* Persistent Global Trust Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Fingerprint className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Global Trust Layer</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <span className="text-muted-foreground">Evidence:</span>
            <span className="text-foreground font-mono">{evidenceCount}</span>
          </div>
          
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <span className="text-muted-foreground">Verified missions:</span>
            <span className="text-foreground font-mono">{verifiedCount}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-medium">
            <span className="text-muted-foreground">Decisions:</span>
            <span className="text-foreground font-mono">{decisionCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">{loading ? "Loading backend" : error ? "Backend unavailable" : "Live backend"}</span>
          </div>
        </div>

      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#fafafa] dark:bg-[#0a0a0a]">
        {currentView === 'artifacts' && <EvidenceArtifactsView />}
        {currentView === 'logs' && <EvidenceLogsView />}
        {currentView === 'claims' && <EvidenceClaimsView />}
        {currentView === 'decisions' && <EvidenceDecisionsView />}
      </div>

    </div>
  );
}
