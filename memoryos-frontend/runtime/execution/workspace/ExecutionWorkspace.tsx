"use client";

import React, { useEffect } from "react";
import { useExecutionStore } from "../store";
import { Activity, ShieldCheck, Box, UserCheck, PlayCircle, Loader2 } from "lucide-react";

// We'll import these as we build them
import { ExecutionPlannerView } from "../perspectives/planner/ExecutionPlannerView";
import { ExecutionWorkersView } from "../perspectives/workers/ExecutionWorkersView";
import { ExecutionEvidenceView } from "../perspectives/evidence/ExecutionEvidenceView";
import { ExecutionValidationView } from "../perspectives/validation/ExecutionValidationView";
import { ExecutionApprovalsView } from "../perspectives/approvals/ExecutionApprovalsView";
import { ExecutionRuntimeView } from "../perspectives/runtime/ExecutionRuntimeView";
import { ExecutionTimelineView } from "../perspectives/timeline/ExecutionTimelineView";

export function ExecutionWorkspace({ activeSection }: { activeSection: string }) {
 const { currentView, setView } = useExecutionStore();

 useEffect(() => {
 if (activeSection.startsWith("execution-")) {
 const viewName = activeSection.replace("execution-", "");
 setView(viewName);
 }
 }, [activeSection, setView]);

 return (
 <div className="flex flex-col w-full h-full bg-muted/50 font-sans overflow-hidden">
 
 {/* Persistent Execution Health Strip */}
 <div className="flex items-center justify-between px-6 py-2 bg-[#111] text-white shrink-0 relative z-20">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Execution</span>
 <div className="size-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
 </div>
 
 <div className="h-4 w-px bg-card/20" />
 
 <div className="flex items-center gap-2 text-[12px] font-medium">
 <span className="text-white/60">Workers</span>
 <span className="text-white">18 Active</span>
 </div>
 
 <div className="flex items-center gap-2 text-[12px] font-medium">
 <span className="text-white/60">Leases</span>
 <span className="text-emerald-400">Healthy</span>
 </div>

 <div className="flex items-center gap-2 text-[12px] font-medium">
 <span className="text-white/60">Policies</span>
 <span className="text-emerald-400">Passing</span>
 </div>

 <div className="flex items-center gap-2 text-[12px] font-medium">
 <span className="text-white/60">Verification Queue</span>
 <span className="text-amber-400">2 Pending</span>
 </div>
 </div>

 <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-900">
 <Activity className="size-3" /> Evidence Stream: Live
 </div>
 </div>

 {/* Main Canvas Area */}
 <div className="flex-1 overflow-y-auto relative">
 {currentView === 'planner' && <ExecutionPlannerView />}
 {currentView === 'workers' && <ExecutionWorkersView />}
 {currentView === 'evidence' && <ExecutionEvidenceView />}
 {currentView === 'validation' && <ExecutionValidationView />}
 {currentView === 'approvals' && <ExecutionApprovalsView />}
 {currentView === 'runtime' && <ExecutionRuntimeView />}
 {currentView === 'timeline' && <ExecutionTimelineView />}
 </div>

 </div>
 );
}
