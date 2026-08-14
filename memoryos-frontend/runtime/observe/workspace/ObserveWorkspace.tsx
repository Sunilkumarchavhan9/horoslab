"use client";

import React, { useEffect } from "react";
import { useObserveStore } from "../store";
import { 
  Activity, 
  Terminal, 
  Clock, 
  Cpu, 
  AlertTriangle,
  Server,
  Network,
  Database,
  Radio,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Perspectives
import { ObserveRuntimeView } from "../perspectives/runtime/ObserveRuntimeView";
import { ObserveTimelineView } from "../perspectives/timeline/ObserveTimelineView";
import { ObserveAnalyticsView } from "../perspectives/analytics/ObserveAnalyticsView";
import { ObservePerformanceView } from "../perspectives/performance/ObservePerformanceView";

export function ObserveWorkspace({ activeSection }: { activeSection: string }) {
  const { currentView, setCurrentView, selectedContextId } = useObserveStore();

  useEffect(() => {
    if (activeSection.startsWith("observe-")) {
      const viewName = activeSection.replace("observe-", "") as any;
      setCurrentView(viewName);
    }
  }, [activeSection, setCurrentView]);

  return (
    <div className="flex flex-col w-full h-full bg-background font-sans overflow-hidden border border-border rounded-sm shadow-sm">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Epoch Telemetry</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2 text-[12px] font-medium">
             <span className="text-muted-foreground">Fleet Status:</span>
             <span className="text-foreground font-mono flex items-center gap-1.5">
               <Radio className="size-3 text-muted-foreground" /> Synchronized
             </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 border border-border rounded-sm">
            <Server className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Global Observation</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
          {currentView === 'runtime' && <ObserveRuntimeView />}
          {currentView === 'timeline' && <ObserveTimelineView />}
          {currentView === 'analytics' && <ObserveAnalyticsView />}
          {currentView === 'performance' && <ObservePerformanceView />}
        </div>

        {/* Inspector (Sidebar) */}
        <div className="w-[320px] shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
           <div className="flex items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">System Telemetry</span>
           </div>
           
           <div className="flex flex-col p-4 gap-6">
              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected Context</span>
                 {selectedContextId ? (
                   <span className="text-[13px] font-mono font-medium text-foreground">{selectedContextId}</span>
                 ) : (
                   <span className="text-[13px] italic text-muted-foreground">No telemetry context selected.</span>
                 )}
              </div>

              {selectedContextId && (
                <>
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Health</span>
                     <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] font-medium text-foreground flex items-center gap-2">
                           <CheckCircle2 className="size-3.5 text-muted-foreground" />
                           Core Stable
                        </span>
                        <span className="text-[11px] font-mono bg-muted/50 px-1.5 py-0.5 rounded-sm border border-border">P99: 45ms</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                       <Network className="size-3.5 text-muted-foreground"/> Active Workers
                     </span>
                     <div className="flex flex-col gap-1.5 text-[12px] text-foreground mt-1 font-mono">
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Allocated</span>
                           <span>48 Nodes</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Utilization</span>
                           <span>84.5%</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                       <Terminal className="size-3.5 text-muted-foreground"/> Global Queue
                     </span>
                     <div className="flex flex-col gap-1.5 mt-1 font-mono">
                        <div className="flex items-center justify-between text-[12px]">
                           <span className="text-muted-foreground">Pending Tasks</span>
                           <span className="text-foreground">17</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                           <span className="text-muted-foreground">Blocked</span>
                           <span className="text-foreground">0</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4 pb-4">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Real-time Alerts</span>
                     <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-start gap-2 text-[12px] bg-muted/20 border border-border p-2 rounded-sm">
                           <AlertTriangle className="size-3.5 text-muted-foreground mt-0.5 shrink-0"/>
                           <span className="text-foreground leading-relaxed">
                              Verification Engine experiencing minor latency spikes (240ms) across US-East pool.
                           </span>
                        </div>
                        <div className="flex items-start gap-2 text-[12px] bg-muted/20 border border-border p-2 rounded-sm">
                           <Database className="size-3.5 text-muted-foreground mt-0.5 shrink-0"/>
                           <span className="text-foreground leading-relaxed">
                              Memory index synchronization completed successfully.
                           </span>
                        </div>
                     </div>
                  </div>
                </>
              )}
           </div>
        </div>
      </div>
      
    </div>
  );
}
