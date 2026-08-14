import React from "react";
import { CheckCircle2, ShieldCheck, Database, Users, Clock, Globe, Building, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettlementResultsView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Mission Closure</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            The final official state of the completed mission. This represents verified, indisputable reality.
          </p>
        </div>

        {/* Top Summary Block */}
        <div className="flex flex-col bg-card border border-border shadow-sm rounded-sm">
           <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-muted/20">
              <div className="flex flex-col">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mission Settled</span>
                 <span className="text-[20px] font-bold text-foreground mt-1">GitHub Token Rotation</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                 <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" />
                 <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Verified & Settled</span>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 p-8">
              
              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <CheckCircle2 className="size-3.5"/> Objective
                 </span>
                 <span className="text-[14px] font-medium text-foreground">Completed</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <ShieldCheck className="size-3.5"/> Verification
                 </span>
                 <span className="text-[14px] font-medium text-emerald-600 dark:text-emerald-500">PASS</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <Database className="size-3.5"/> Evidence
                 </span>
                 <span className="text-[14px] font-medium text-foreground">18 Artifacts</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <Users className="size-3.5"/> Workers
                 </span>
                 <span className="text-[14px] font-medium text-foreground">4 Agents</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <Clock className="size-3.5"/> Duration
                 </span>
                 <span className="text-[14px] font-medium text-foreground">14m 12s</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <Globe className="size-3.5"/> Reality Updated
                 </span>
                 <span className="text-[14px] font-medium text-foreground">YES</span>
              </div>

              <div className="flex flex-col gap-1.5">
                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                   <Building className="size-3.5"/> Institution Updated
                 </span>
                 <span className="text-[14px] font-medium text-foreground">YES</span>
              </div>

           </div>
        </div>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-8">
           
           <div className="flex flex-col gap-4">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">Mission Summary</h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                 All active GitHub PATs (Personal Access Tokens) for the core engineering team were rotated. The new tokens were provisioned, securely injected into the CI/CD pipeline secrets manager, and distributed to engineers via secure channels. Old tokens were revoked across all repositories.
              </p>
           </div>

           <div className="flex flex-col gap-4">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">Execution Timeline</h2>
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3 text-[13px]">
                   <span className="font-mono text-muted-foreground w-16">10:02a</span>
                   <span className="text-foreground">Authentication verified with GitHub Enterprise.</span>
                 </div>
                 <div className="flex items-center gap-3 text-[13px]">
                   <span className="font-mono text-muted-foreground w-16">10:05a</span>
                   <span className="text-foreground">New tokens generated and tested.</span>
                 </div>
                 <div className="flex items-center gap-3 text-[13px]">
                   <span className="font-mono text-muted-foreground w-16">10:11a</span>
                   <span className="text-foreground">CI/CD secrets updated.</span>
                 </div>
                 <div className="flex items-center gap-3 text-[13px]">
                   <span className="font-mono text-muted-foreground w-16">10:16a</span>
                   <span className="text-foreground">Legacy tokens revoked successfully.</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">Evidence & Verification Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex flex-col bg-card border border-border p-4 rounded-sm shadow-sm">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Evidence Captured</span>
                    <span className="text-[13px] text-foreground">18 individual artifacts captured, including API response logs, secret injection hashes, and revocation confirmations.</span>
                 </div>
                 <div className="flex flex-col bg-card border border-border p-4 rounded-sm shadow-sm">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Verification PASS</span>
                    <span className="text-[13px] text-foreground">Policies enforced: pol-1 (Emergency Rotation) & pol-7 (Dual Approval). 99.8% Confidence achieved.</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">Settlement Status</h2>
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm">
                 <Check className="size-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                 <p className="text-[13px] text-foreground">
                   Mission execution finalized. The underlying realities have been adjusted and institutional modifications have been committed to the ledger. This mission is permanently closed.
                 </p>
              </div>
           </div>

        </div>
        
      </div>
    </div>
  );
}
