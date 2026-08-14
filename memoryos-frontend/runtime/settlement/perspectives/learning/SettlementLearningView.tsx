import React from "react";
import { BookOpen, Network, Database, Shield, Zap, BookMarked, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettlementLearningView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Institutional Learning</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            The forward-looking process of the Settlement Runtime. Transforms the outcomes of this mission into permanent institutional intelligence.
          </p>
        </div>

        {/* Memory Updates */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground">Memory Updates Committed</h2>
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm">
             <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
               {/* Knowledge Base */}
               <div className="flex items-center gap-3 p-4">
                 <Database className="size-4 text-muted-foreground" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Knowledge Base</span>
                   <span className="text-[13px] font-medium text-foreground">Updated</span>
                 </div>
               </div>
               {/* Playbooks */}
               <div className="flex items-center gap-3 p-4">
                 <BookMarked className="size-4 text-muted-foreground" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Playbooks</span>
                   <span className="text-[13px] font-medium text-foreground">Updated</span>
                 </div>
               </div>
               {/* Policies */}
               <div className="flex items-center gap-3 p-4">
                 <Shield className="size-4 text-muted-foreground" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Policies</span>
                   <span className="text-[13px] font-medium text-foreground">Updated</span>
                 </div>
               </div>
               {/* Genome */}
               <div className="flex items-center gap-3 p-4 bg-muted/20">
                 <Network className="size-4 text-foreground" />
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Genome</span>
                   <span className="text-[13px] font-bold text-foreground">Evolved</span>
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* Learning Pipeline */}
        <div className="flex flex-col gap-4 mt-2">
           <h2 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground">Learning Derivation Flow</h2>
           
           <div className="flex flex-col bg-card border border-border shadow-sm rounded-sm">
             <div className="flex flex-col divide-y divide-border/50">
                {/* Problem */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Problem</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-[13px] text-foreground leading-relaxed">Tokens were not being rotated proactively, leading to a long-lived credential vulnerability.</p>
                   </div>
                </div>
                
                {/* Root Cause */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Root Cause</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-[13px] text-foreground leading-relaxed">Lack of an automated cron job to trigger the Secret Rotation Playbook before credential expiration.</p>
                   </div>
                </div>
                
                {/* Solution */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Solution (Mission Output)</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-[13px] text-foreground leading-relaxed">Implemented automated token rotation and injected the new credentials directly into CI/CD secrets manager.</p>
                   </div>
                </div>
                
                {/* Evidence */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Evidence Captured</span>
                   </div>
                   <div className="flex-1">
                      <span className="text-[13px] font-mono text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-sm">evd-109: Rotation Script Executed Successfully</span>
                   </div>
                </div>
                
                {/* Lesson Abstracted */}
                <div className="flex flex-col md:flex-row p-5 bg-muted/20 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Lesson Abstracted</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-[13px] font-medium text-foreground leading-relaxed">All infrastructure secrets must be bound to a 30-day lifecycle with an automated rotation mission triggered at day 28.</p>
                   </div>
                </div>
                
                {/* Playbook Updated */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BookOpen className="size-3"/> Playbook Updated</span>
                   </div>
                   <div className="flex-1 flex items-center gap-3">
                      <span className="text-[13px] font-mono text-muted-foreground bg-muted/50 border border-transparent px-1.5 rounded-sm">plb-sec-01 v1.2</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="text-[13px] font-mono font-bold text-foreground bg-card border border-border shadow-sm px-1.5 rounded-sm">plb-sec-01 v1.3</span>
                   </div>
                </div>
                
                {/* Genome Evolved */}
                <div className="flex flex-col md:flex-row p-5 gap-2 md:gap-0">
                   <div className="w-[200px] shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-2"><Network className="size-3"/> Genome Evolved</span>
                   </div>
                   <div className="flex-1 flex flex-col gap-2">
                      <p className="text-[13px] text-foreground leading-relaxed">The institutional behavior has permanently changed. Future missions involving infrastructure provisioning will now automatically attach the <span className="font-mono bg-muted/50 border border-border px-1 rounded-sm text-foreground">30-day-lifecycle</span> trait.</p>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mt-1">
                        <Zap className="size-3"/> Future Missions Improved
                      </span>
                   </div>
                </div>
                
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
