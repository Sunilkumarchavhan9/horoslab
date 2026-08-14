"use client";

import { Zap, Box, Key, ShieldCheck, CheckCircle2, Cpu, FileText, ArrowRight, Activity, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const WORKERS = [
  {
    id: "wrk-hum-12",
    name: "Human Worker",
    node: "node-user-alice",
    mission: "Rotate Production Tokens",
    currentTask: "Waiting for Human Input",
    progress: 65,
    lease: "28m remaining",
    evidence: 14,
    cpu: "0.0%",
    mem: "0MB",
    status: "Blocked"
  },
  {
    id: "wrk-ai-7",
    name: "AI Worker",
    node: "node-core-3",
    mission: "Stream Ingestion",
    currentTask: "Analyzing Logs",
    progress: 92,
    lease: "Permanent",
    evidence: 420,
    cpu: "85.2%",
    mem: "8048MB",
    status: "Active"
  },
  {
    id: "wrk-svc-1",
    name: "Service Worker",
    node: "node-gamma-2",
    mission: "Rollout v14.2.0",
    currentTask: "Executing Deployment Script",
    progress: 40,
    lease: "Expired (Paused)",
    evidence: 3,
    cpu: "4.2%",
    mem: "128MB",
    status: "Blocked"
  },
  {
    id: "wrk-rob-452",
    name: "Robot Worker (Simulation)",
    node: "node-robotics-1",
    mission: "Warehouse Inspection",
    currentTask: "Scanning Zone C",
    progress: 15,
    lease: "2h remaining",
    evidence: 89,
    cpu: "45.0%",
    mem: "1024MB",
    status: "Active"
  }
];

export function ExecutionWorkersView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <Zap className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Active Workers</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            The operational thread pool executing institutional missions.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-hidden bg-background">
        
        {/* Table Header */}
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-[300px] flex items-center gap-2"><Box className="size-3.5" /> Worker Identity</div>
          <div className="flex-[1.5] flex items-center gap-2"><Terminal className="size-3.5" /> Mission & Task</div>
          <div className="w-[120px] flex items-center gap-2"><Key className="size-3.5" /> Lease TTL</div>
          <div className="w-[120px] flex items-center gap-2"><Cpu className="size-3.5" /> Telemetry</div>
          <div className="flex-1 flex items-center gap-2"><Activity className="size-3.5" /> Progress</div>
          <div className="w-[100px] flex items-center justify-end gap-2"><FileText className="size-3.5" /> Evidence</div>
        </div>

        {/* Dense Workers Ledger */}
        <div className="flex flex-col overflow-y-auto divide-y divide-border">
          {WORKERS.map((worker) => (
            <div key={worker.id} className="flex items-stretch hover:bg-muted/20 transition-colors w-full cursor-pointer group bg-card">
              
              {/* Identity Column */}
              <div className="flex flex-col justify-center p-5 pr-8 w-[300px] shrink-0 border-r border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors tracking-tight">{worker.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted border border-border px-1.5 py-0.5 rounded-sm">{worker.id}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">@{worker.node}</span>
                </div>
              </div>

              {/* Responsibility Column */}
              <div className="flex flex-col justify-center p-5 pr-8 flex-[1.5] border-r border-border/50">
                <span className="text-[14px] font-bold text-foreground tracking-tight mb-1">{worker.mission}</span>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-mono bg-muted/30 p-1.5 rounded-sm border border-border/50">
                  <ArrowRight className="size-3 text-blue-500" />
                  <span>{worker.currentTask}</span>
                </div>
              </div>

              {/* Lease Column */}
              <div className="flex flex-col justify-center p-5 w-[120px] shrink-0 border-r border-border/50">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border text-center",
                  worker.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                )}>
                  {worker.lease}
                </span>
              </div>

              {/* Telemetry Column */}
              <div className="flex flex-col justify-center gap-1.5 p-5 w-[120px] shrink-0 border-r border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase">CPU</span>
                  <span className="text-[11px] font-mono text-foreground">{worker.cpu}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase">MEM</span>
                  <span className="text-[11px] font-mono text-foreground">{worker.mem}</span>
                </div>
              </div>

              {/* Progress Column */}
              <div className="flex flex-col justify-center p-5 flex-1 border-r border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{worker.status}</span>
                  <span className="text-[11px] font-mono font-bold text-foreground">{worker.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border">
                  <div className={cn(
                    "h-full transition-all duration-500",
                    worker.status === "Active" ? "bg-blue-500" : "bg-rose-500"
                  )} style={{ width: `${worker.progress}%` }} />
                </div>
              </div>

              {/* Evidence Column */}
              <div className="flex flex-col justify-center items-end p-5 w-[100px] shrink-0">
                <span className="text-[18px] font-mono font-bold text-foreground leading-none">{worker.evidence}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-1 uppercase tracking-wider mt-1">
                  <ShieldCheck className="size-3" /> Valid
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
