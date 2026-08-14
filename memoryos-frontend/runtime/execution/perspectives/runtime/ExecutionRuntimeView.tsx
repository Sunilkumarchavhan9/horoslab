"use client";

import { Activity, Zap, ShieldAlert, Key, Network, CheckCircle2, Cpu, Database, Server, MemoryStick } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExecutionRuntimeView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <Activity className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Execution Engine</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Live telemetry of the underlying institutional execution runtime.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-y-auto bg-background p-8 gap-8">
        
        {/* Top Level Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          
          <div className="flex flex-col p-6 bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Zap className="size-3.5" /> Workers</span>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[36px] font-mono font-bold text-foreground leading-none tracking-tight">18</span>
              <span className="text-[14px] font-mono text-muted-foreground">Running</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>6 Queued Wait-States</span>
              <span>24 Capacity</span>
            </div>
          </div>

          <div className="flex flex-col p-6 bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Cpu className="size-3.5" /> Compute</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[36px] font-mono font-bold text-foreground leading-none tracking-tight">42%</span>
              <span className="text-[14px] font-mono text-muted-foreground">CPU</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border">
              <div className="h-full bg-blue-500" style={{ width: '42%' }} />
            </div>
          </div>

          <div className="flex flex-col p-6 bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Database className="size-3.5" /> Memory</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[36px] font-mono font-bold text-foreground leading-none tracking-tight">1.2</span>
              <span className="text-[14px] font-mono text-muted-foreground">GB</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border">
              <div className="h-full bg-purple-500" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="flex flex-col p-6 bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Server className="size-3.5" /> Failures</span>
              <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[36px] font-mono font-bold text-foreground leading-none tracking-tight">0.02%</span>
              <span className="text-[14px] font-mono text-muted-foreground">Rate</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-sm">
              <span>Warning: 2 Failed Pods</span>
            </div>
          </div>

        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          
          <div className="flex flex-col bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <Network className="size-4 text-muted-foreground" />
              <span className="text-[12px] font-bold text-foreground uppercase tracking-wider">Policy Engine Status</span>
            </div>
            <div className="flex items-center justify-between p-6 divide-x divide-border">
              <div className="flex flex-col flex-1 items-center gap-2">
                <span className="text-[32px] font-mono font-bold text-foreground leading-none tracking-tight">1.2ms</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avg Latency</span>
              </div>
              <div className="flex flex-col flex-1 items-center gap-2">
                <span className="text-[32px] font-mono font-bold text-foreground leading-none tracking-tight">14,204</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Evals / Min</span>
              </div>
              <div className="flex flex-col flex-1 items-center gap-2">
                <span className="text-[32px] font-mono font-bold text-emerald-500 leading-none tracking-tight">3</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Policies</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-card border border-border rounded-sm shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <Key className="size-4 text-muted-foreground" />
              <span className="text-[12px] font-bold text-foreground uppercase tracking-wider">Lease Pool & Evidence Stream</span>
            </div>
            <div className="flex items-center justify-between p-6 divide-x divide-border">
              <div className="flex flex-col flex-1 items-center gap-2">
                <span className="text-[32px] font-mono font-bold text-foreground leading-none tracking-tight">42</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Leases</span>
              </div>
              <div className="flex flex-col flex-1 items-center gap-2">
                <span className="text-[32px] font-mono font-bold text-foreground leading-none tracking-tight">14.2<span className="text-[16px] text-muted-foreground ml-1">MB/s</span></span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Evidence Ingestion</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
