"use client";

import { UserCheck, ShieldAlert, FileText, Check, X, AlertTriangle, Fingerprint, Lock, ArrowRight, Share } from "lucide-react";
import { cn } from "@/lib/utils";

const APPROVALS = [
  {
    id: "apr-2041",
    mission: "GitHub Token Rotation",
    requestedBy: "Security Worker (agt-sec-42)",
    reason: "Revoking 42 tokens from memoryos-core across 3 environments.",
    risk: "High",
    policies: ["Require Human Authority for Destructive Actions"],
    evidence: ["evt-912: Security Threat Detected", "aws-kms-proof-2"],
    status: "pending"
  }
];

export function ExecutionApprovalsView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <UserCheck className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Human Authority Required</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            High-stakes operational decisions pending explicit cryptographic approval.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-y-auto bg-background p-8">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
          {APPROVALS.map((app) => (
            <div key={app.id} className="flex flex-col w-full border border-border shadow-sm rounded-sm bg-card overflow-hidden">
              
              {/* Warning Banner - Monochrome with Red Icon */}
              <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-5 text-rose-500" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">Execution Blocked</span>
                    <span className="text-[12px] font-medium text-muted-foreground">Pending human cryptographic signature</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-foreground border border-border px-2.5 py-1 rounded-sm uppercase tracking-wider bg-card">
                  Risk Level: {app.risk}
                </span>
              </div>

              <div className="flex flex-col md:flex-row w-full divide-y md:divide-y-0 md:divide-x divide-border">
                
                {/* Context Panel */}
                <div className="flex flex-col p-8 flex-[1.5]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[20px] font-bold text-foreground tracking-tight">{app.mission}</span>
                    <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-2 py-1 rounded-sm">{app.id}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Fingerprint className="size-3" /> Requested By</span>
                      <span className="text-[13px] font-mono text-foreground bg-muted/50 p-2 rounded-sm border border-border/50">{app.requestedBy}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FileText className="size-3" /> Reason for Execution</span>
                      <p className="text-[13px] text-muted-foreground leading-relaxed p-2">{app.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Justification Panel */}
                <div className="flex flex-col p-8 flex-1 bg-muted/10">
                  <div className="flex flex-col gap-6">
                    
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ShieldAlert className="size-3" /> Triggering Policies
                      </span>
                      <div className="flex flex-col gap-2">
                        {app.policies.map((pol, i) => (
                          <div key={i} className="flex items-center gap-2 bg-card border border-border p-2 rounded-sm text-foreground">
                            <Lock className="size-3 shrink-0 text-muted-foreground" />
                            <span className="text-[12px] font-bold leading-tight">{pol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="size-3" /> Supporting Evidence
                      </span>
                      <div className="flex flex-col gap-2">
                        {app.evidence.map((ev, i) => (
                          <div key={i} className="flex items-center gap-2 bg-card border border-border p-2 rounded-sm text-foreground">
                            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                            <span className="text-[12px] font-mono font-bold truncate leading-tight">{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Strict Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center p-6 border-t border-border bg-card gap-4">
                <button className="w-full sm:w-auto flex-[0.5] bg-foreground hover:bg-foreground/90 text-background rounded-sm py-3 font-bold text-[12px] flex items-center justify-center gap-2 transition-colors">
                  <Check className="size-4" /> Cryptographically Sign & Approve
                </button>
                <button className="w-full sm:w-auto flex-[0.5] bg-card border border-border text-foreground rounded-sm py-3 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-muted transition-colors">
                  <X className="size-4" /> Reject Execution
                </button>
                <div className="flex-1" />
                <button className="w-full sm:w-auto px-6 bg-muted border border-border text-foreground rounded-sm py-3 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors">
                  <Share className="size-4" /> Delegate Authority
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
