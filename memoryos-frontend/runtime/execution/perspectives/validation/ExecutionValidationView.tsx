"use client";

import { Scale, ShieldCheck, Database, GitBranch, ArrowRight, Check, Zap, Eye, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEWS = [
  {
    id: "rev-8291",
    execution: "msn-rotate-github",
    why: "Validating cryptographic signature of the new token before reality mutation.",
    evidence: "aws-kms-proof-2",
    reviewer: "sys-verifier-pool",
    confidence: 100,
    decision: "Passed",
    verification: "Written to Immutable Ledger"
  },
  {
    id: "rev-8292",
    execution: "msn-rotate-github",
    why: "Ensuring operation does not exceed strict agent spend limits (pol-3).",
    evidence: "budget-telemetry-4",
    reviewer: "sys-policy-engine",
    confidence: 99.8,
    decision: "Passed",
    verification: "Ledger Synced"
  },
  {
    id: "rev-8293",
    execution: "msn-deploy-prod",
    why: "Production reality node mutation requires strict human approval.",
    evidence: "pol-2-violation-flag",
    reviewer: "@security-ops",
    confidence: null,
    decision: "Pending Human Review",
    verification: "Awaiting Input"
  }
];

export function ExecutionValidationView() {
  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      
      {/* Header Panel */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
          <Scale className="size-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold leading-none tracking-tight">Validation Reviews</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Deterministic evaluations of execution evidence prior to institutional state updates.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-hidden bg-background">
        
        {/* Table Header */}
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-[120px] flex items-center gap-2"><Zap className="size-3.5" /> Execution</div>
          <div className="flex-[1.5] flex items-center gap-2">Review Rationale (Why)</div>
          <div className="w-[160px] flex items-center gap-2"><Database className="size-3.5" /> Evidence</div>
          <div className="w-[140px] flex items-center gap-2"><Eye className="size-3.5" /> Reviewer</div>
          <div className="flex-1 flex items-center gap-2"><Scale className="size-3.5" /> Decision</div>
        </div>

        {/* Reviews Ledger */}
        <div className="flex flex-col overflow-y-auto divide-y divide-border">
          {REVIEWS.map((rev) => (
            <div key={rev.id} className="flex items-stretch hover:bg-muted/20 transition-colors w-full group bg-card">
              
              {/* Execution Column */}
              <div className="flex flex-col justify-center p-5 w-[120px] shrink-0 border-r border-border/50">
                <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-2 py-1 rounded-sm w-fit mb-2">{rev.id}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{rev.execution}</span>
              </div>

              {/* Why Column */}
              <div className="flex flex-col justify-center p-5 flex-[1.5] border-r border-border/50">
                <span className="text-[13px] text-foreground leading-relaxed">{rev.why}</span>
              </div>

              {/* Evidence Column */}
              <div className="flex flex-col justify-center p-5 w-[160px] shrink-0 border-r border-border/50">
                <span className="text-[11px] font-mono text-muted-foreground truncate" title={rev.evidence}>{rev.evidence}</span>
              </div>

              {/* Reviewer Column */}
              <div className="flex flex-col justify-center gap-1 p-5 w-[140px] shrink-0 border-r border-border/50">
                <span className="text-[11px] font-mono font-bold text-foreground bg-muted/30 border border-border/50 px-2 py-0.5 rounded-sm w-fit">{rev.reviewer}</span>
                {rev.confidence !== null && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Conf: {rev.confidence}%</span>
                )}
              </div>

              {/* Decision Column */}
              <div className="flex flex-col justify-center p-5 flex-1 relative">
                <div className="flex flex-col items-start gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border flex items-center gap-1.5",
                    rev.decision === "Passed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" : 
                    "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
                  )}>
                    {rev.decision === "Passed" ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                    {rev.decision}
                  </span>
                  
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                    <GitBranch className="size-3" /> {rev.verification}
                  </span>
                </div>
                
                <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-4 text-blue-500" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
