"use client";

import React, { useEffect } from "react";
import { useVerificationStore } from "../store";
import { ShieldCheck, Scale, BadgeCheck } from "lucide-react";
import { useMissionRuntimeData } from "../../missions/runtime/mission-runtime-data";

// Perspectives
import { VerificationRunsView } from "../perspectives/runs/VerificationRunsView";
import { VerificationOutcomesView } from "../perspectives/outcomes/VerificationOutcomesView";
import { VerificationAssuranceView } from "../perspectives/assurance/VerificationAssuranceView";
import { VerificationCertificatesView } from "../perspectives/certificates/VerificationCertificatesView";
import { VerificationChallengesView } from "../perspectives/challenges/VerificationChallengesView";
import { VerificationGraphView } from "../perspectives/graph/VerificationGraphView";

export function VerificationWorkspace({ activeSection }: { activeSection: string }) {
  const { currentView, setView, selectedRunId } = useVerificationStore();
  const { missions, loading, error } = useMissionRuntimeData();
  const latestMission = missions.find((mission) => Boolean(mission.verificationRun)) ?? missions[0] ?? null;
  const decision = latestMission?.verificationRun?.finalDecision ?? "Pending";

  useEffect(() => {
    if (activeSection.startsWith("verification-")) {
      const viewName = activeSection.replace("verification-", "") as any;
      setView(viewName);
    }
  }, [activeSection, setView]);

  return (
    <div className="flex flex-col w-full h-full bg-background font-sans overflow-hidden border border-border rounded-sm shadow-sm">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">HOROS Verification</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2 text-[12px] font-medium">
             <span className="text-muted-foreground">Backend:</span>
             <span className="text-foreground font-mono flex items-center gap-1.5"><div className={`size-2 rounded-full ${error ? "bg-red-500" : loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}/> {error ? "Unavailable" : loading ? "Loading" : "Live"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">{decision}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
          {currentView === 'runs' && <VerificationRunsView />}
          {currentView === 'outcomes' && <VerificationOutcomesView />}
          {currentView === 'assurance' && <VerificationAssuranceView />}
          {currentView === 'certificates' && <VerificationCertificatesView />}
          {currentView === 'challenges' && <VerificationChallengesView />}
          {currentView === 'graph' && <VerificationGraphView />}
        </div>

        {/* Inspector (Sidebar) */}
        <div className="w-[320px] shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
           <div className="flex items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inspector</span>
           </div>
           
           <div className="flex flex-col p-4 gap-6">
              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected Context</span>
                 {selectedRunId || latestMission?.verificationRun?.id ? (
                   <span className="text-[13px] font-mono text-foreground">{selectedRunId ?? latestMission?.verificationRun?.id}</span>
                 ) : (
                   <span className="text-[13px] italic text-muted-foreground">No verification context selected.</span>
                 )}
              </div>

              {(selectedRunId || latestMission?.verificationRun) && (
                <>
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><BadgeCheck className="size-3"/> Decision</span>
                     <div className="flex items-center justify-between">
                       <span className="text-[14px] font-semibold text-foreground">{decision}</span>
                       <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm font-bold">BACKEND</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evidence Evaluated</span>
                     <span className="text-[13px] font-mono text-foreground">{latestMission?.evidence?.length ?? 0} records</span>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Certificate</span>
                     <span className="text-[12px] font-mono text-muted-foreground">{latestMission?.certificate?.id ?? "Pending"}</span>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mission</span>
                     <span className="text-[12px] text-foreground">{latestMission?.title ?? "No mission selected"}</span>
                  </div>
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
