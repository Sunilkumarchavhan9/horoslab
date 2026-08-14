import React from "react";
import { Network, Database, Shield, Award, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationGraphView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col px-8 py-6 border-b border-border bg-card shrink-0">
        <h1 className="text-[18px] font-bold leading-none tracking-tight">Verification Graph</h1>
        <p className="text-[13px] text-muted-foreground mt-2">
          Visualizing the full institutional lifecycle: Claim → Evidence → Policies → Verifier → Certificate.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] p-8 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
           
           {/* Node 1: Claim */}
           <div className="flex flex-col items-center gap-4">
              <div className="w-48 bg-card border border-border shadow-sm rounded-sm p-4 flex flex-col items-center text-center">
                 <div className="size-10 rounded-sm bg-muted flex items-center justify-center mb-2">
                    <FileText className="size-5 text-muted-foreground" />
                 </div>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Origin</span>
                 <span className="text-[14px] font-bold mt-1">Claim</span>
                 <span className="text-[12px] text-muted-foreground mt-2 font-mono bg-muted/50 px-2 py-1 rounded-sm w-full">clm-912a</span>
              </div>
           </div>

           <ArrowRight className="size-5 text-muted-foreground opacity-50" />

           {/* Node 2: Evidence */}
           <div className="flex flex-col items-center gap-4">
              <div className="w-48 bg-card border border-border shadow-sm rounded-sm p-4 flex flex-col items-center text-center relative">
                 <div className="absolute -top-3 -right-3 size-6 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center">3</div>
                 <div className="size-10 rounded-sm bg-muted flex items-center justify-center mb-2">
                    <Database className="size-5 text-muted-foreground" />
                 </div>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Support</span>
                 <span className="text-[14px] font-bold mt-1">Evidence</span>
                 <span className="text-[12px] text-emerald-600 dark:text-emerald-500 font-medium mt-2 flex items-center gap-1"><CheckCircle2 className="size-3" /> Gathered</span>
              </div>
           </div>

           <ArrowRight className="size-5 text-muted-foreground opacity-50" />

           {/* Node 3: Policies */}
           <div className="flex flex-col items-center gap-4">
              <div className="w-48 bg-card border border-border shadow-sm rounded-sm p-4 flex flex-col items-center text-center relative">
                 <div className="absolute -top-3 -right-3 size-6 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center">2</div>
                 <div className="size-10 rounded-sm bg-muted flex items-center justify-center mb-2">
                    <Shield className="size-5 text-muted-foreground" />
                 </div>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Rules</span>
                 <span className="text-[14px] font-bold mt-1">Policies</span>
                 <span className="text-[12px] text-emerald-600 dark:text-emerald-500 font-medium mt-2 flex items-center gap-1"><CheckCircle2 className="size-3" /> Satisfied</span>
              </div>
           </div>

           <ArrowRight className="size-5 text-muted-foreground opacity-50" />

           {/* Node 4: Verifier */}
           <div className="flex flex-col items-center gap-4">
              <div className="w-48 bg-card border border-emerald-500/30 shadow-sm rounded-sm p-4 flex flex-col items-center text-center">
                 <div className="size-10 rounded-sm bg-emerald-500/10 flex items-center justify-center mb-2">
                    <Network className="size-5 text-emerald-600 dark:text-emerald-500" />
                 </div>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Engine</span>
                 <span className="text-[14px] font-bold mt-1">Verification</span>
                 <span className="text-[12px] font-mono font-bold text-foreground mt-2 border border-border bg-muted/50 px-2 py-0.5 rounded-sm w-full">99.8% CONF</span>
              </div>
           </div>

           <ArrowRight className="size-5 text-muted-foreground opacity-50" />

           {/* Node 5: Certificate */}
           <div className="flex flex-col items-center gap-4">
              <div className="w-48 bg-card border border-border shadow-sm rounded-sm p-4 flex flex-col items-center text-center">
                 <div className="size-10 rounded-sm bg-muted flex items-center justify-center mb-2">
                    <Award className="size-5 text-muted-foreground" />
                 </div>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Result</span>
                 <span className="text-[14px] font-bold mt-1">Certificate</span>
                 <span className="text-[12px] text-muted-foreground mt-2 font-mono bg-muted/50 px-2 py-1 rounded-sm w-full truncate">0x8f2a...9c41</span>
              </div>
           </div>

        </div>
      </div>
      
    </div>
  );
}
