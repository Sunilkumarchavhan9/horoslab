"use client";

import { Target, GitCommit, Key, ShieldCheck, FileText, Globe, Rocket, Check, AlertTriangle, ArrowRight, Layers, Box, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_STEPS = [
  { id: "step-obj", name: "Objective Identified", icon: Target, status: "completed", desc: "Rotate all production GitHub tokens", time: "0.2s" },
  { id: "step-dag", name: "Execution DAG Generated", icon: GitCommit, status: "completed", desc: "4 Parallel Sub-tasks Orchestrated", time: "1.4s" },
  { id: "step-worker", name: "Worker Pool Allocation", icon: Box, status: "completed", desc: "Security Agent (v12) selected", time: "0.1s" },
  { id: "step-auth", name: "Authority Analysis", icon: Key, status: "completed", desc: "Requires GitHub Admin + AWS KMS Leases", time: "0.3s" },
  { id: "step-pol", name: "Policy Simulation", icon: ShieldCheck, status: "completed", desc: "Simulated 14 policies. 0 violations.", time: "2.1s" },
  { id: "step-ev", name: "Expected Evidence", icon: FileText, status: "completed", desc: "Will emit 4 audit logs, 1 cryptographic proof.", time: "0.1s" },
  { id: "step-real", name: "Reality Impact", icon: Globe, status: "pending", desc: "Targeting GitHub Reality Node", time: "-" }
];

export function ExecutionPlannerView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <GitCommit className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Execution Planner</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Orchestrating the Directed Acyclic Graph (DAG) prior to runtime launch.
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* DAG Pipeline View */}
        <div className="flex flex-col flex-[2] bg-background border-r border-border overflow-y-auto relative">
          
          <div className="flex items-center justify-between px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Compilation Sequence</span>
            <span>Duration</span>
          </div>

          <div className="flex flex-col p-8 pb-16 relative">
            <div className="absolute left-[59px] top-8 bottom-16 w-px bg-border z-0" />
            
            {PLAN_STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-6 mb-8 relative z-10 group">
                <div className={cn(
                  "size-8 rounded-sm border flex items-center justify-center shrink-0 transition-colors shadow-sm",
                  step.status === "completed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "border-border bg-muted text-muted-foreground"
                )}>
                  {step.status === "completed" ? <Check className="size-4" /> : <step.icon className="size-4" />}
                </div>
                
                <div className="flex items-center justify-between flex-1 bg-card border border-border p-4 rounded-sm shadow-sm group-hover:border-foreground/20 transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <span className={cn("text-[14px] font-bold tracking-tight", step.status === "completed" ? "text-foreground" : "text-muted-foreground")}>{step.name}</span>
                    <span className={cn("text-[13px]", step.status === "completed" ? "text-muted-foreground" : "text-muted-foreground/50")}>{step.desc}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Readiness Panel */}
        <div className="flex flex-col flex-1 bg-muted/10">
          
          <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Readiness Telemetry
          </div>

          <div className="flex flex-col p-8 gap-6 flex-1 overflow-y-auto">
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Box className="size-3" /> Workers Required</span>
              <div className="flex items-center justify-between text-[13px] font-mono text-foreground bg-card border border-border p-3 rounded-sm">
                <span>Security Agent Pool</span>
                <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-sm">v12</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Key className="size-3" /> Temporary Leases</span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[13px] font-mono text-foreground bg-card border border-border p-3 rounded-sm">
                  <span>github_admin_token</span>
                  <span className="text-muted-foreground">30m TTL</span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-mono text-foreground bg-card border border-border p-3 rounded-sm">
                  <span>aws_kms_decrypt</span>
                  <span className="text-muted-foreground">15m TTL</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Fingerprint className="size-3" /> Verification Level</span>
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 p-4 rounded-sm">
                <AlertTriangle className="size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-bold uppercase tracking-wider">Strict (Human-in-the-loop)</span>
                  <span className="text-[12px] font-medium leading-relaxed">This operation mutates production reality. Human approval is strictly required prior to execution.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Launch Button Area */}
          <div className="p-8 border-t border-border bg-card">
            <button className="w-full bg-foreground text-background rounded-sm py-4 font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors">
              <Rocket className="size-4" /> Finalize Plan & Launch
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}


