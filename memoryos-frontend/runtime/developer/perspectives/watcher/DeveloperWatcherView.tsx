import React from "react";
import { Activity, AlertTriangle, ArrowRight, GitMerge, FileCode2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperWatcherView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto p-12 custom-scrollbar">
      
      <div className="flex flex-col max-w-5xl mx-auto w-full gap-8">
         
         <div className="flex flex-col gap-4">
            <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-tight">
              External API Watcher
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-3xl">
              Dhyra automatically tracks changes to external third-party APIs used by your Institution. When a breaking change is detected, it automatically identifies affected missions and suggests code migrations.
            </p>
         </div>

         <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search watched APIs (e.g., Stripe, GitHub, Salesforce)..." 
                 className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2 text-[13px] focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" 
               />
            </div>
            <button className="text-[13px] bg-[#27272a] hover:bg-muted text-foreground px-4 py-2 rounded-md transition-colors border border-border/80 hover:border-border">
               Add API Endpoint to Watch
            </button>
         </div>

         {/* Watcher Alerts */}
         <div className="flex flex-col gap-6 mt-4">
            
            {/* Alert 1 - Breaking Stripe */}
            <div className="flex flex-col border border-orange-500/30 bg-card rounded-md overflow-hidden shadow-sm shadow-orange-500/5">
               <div className="flex items-center justify-between p-5 border-b border-border bg-orange-500/5">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-orange-500/20 rounded-md">
                        <AlertTriangle className="size-5 text-orange-400" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-foreground flex items-center gap-2">
                           Stripe API
                           <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">Breaking Change Detected</span>
                        </span>
                        <span className="text-[12px] text-muted-foreground mt-1">Detected 4 hours ago via OpenAPI schema diff.</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[13px] text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border">
                     <span>v1.20</span>
                     <ArrowRight className="size-3" />
                     <span className="text-orange-400 font-bold">v2.0 (2026-07)</span>
                  </div>
               </div>

               <div className="grid grid-cols-3 divide-x divide-[#27272a]">
                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Affected Missions</span>
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[13px] text-foreground">
                           <GitMerge className="size-3.5 text-blue-400" /> Process Monthly Subscriptions
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-foreground">
                           <GitMerge className="size-3.5 text-blue-400" /> Issue Customer Refunds
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Affected SDKs / Extensions</span>
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[13px] text-foreground font-mono">
                           <FileCode2 className="size-3.5 text-emerald-400" /> @dhyra/ext-stripe
                        </div>
                        <span className="text-[11px] text-orange-400">Uses deprecated charges.create endpoint.</span>
                     </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Migration</span>
                     <button className="bg-foreground text-background text-[12px] font-medium px-4 py-2 rounded-sm hover:bg-neutral-200 transition-colors">
                        View Auto-Generated PR
                     </button>
                     <span className="text-[11px] text-muted-foreground">Dhyra has generated a migration PR replacing Charges with PaymentIntents.</span>
                  </div>
               </div>
            </div>

            {/* Alert 2 - GitHub Non-Breaking */}
            <div className="flex flex-col border border-border bg-card rounded-md overflow-hidden hover:border-border/80 hover:border-border transition-colors">
               <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-[#27272a] rounded-md">
                        <Activity className="size-5 text-blue-400" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-foreground flex items-center gap-2">
                           GitHub API
                           <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">New Features Added</span>
                        </span>
                        <span className="text-[12px] text-muted-foreground mt-1">Detected yesterday via changelog polling.</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[13px] text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border">
                     <span>v2022-11-28</span>
                     <ArrowRight className="size-3" />
                     <span className="text-foreground font-bold">v2026-07-26</span>
                  </div>
               </div>

               <div className="grid grid-cols-3 divide-x divide-[#27272a]">
                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Affected Missions</span>
                     <span className="text-[13px] text-muted-foreground">None. Backwards compatible.</span>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Affected SDKs / Extensions</span>
                     <div className="flex items-center gap-2 text-[13px] text-foreground font-mono">
                        <FileCode2 className="size-3.5 text-emerald-400" /> @dhyra/ext-github
                     </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Actions</span>
                     <span className="text-[12px] text-muted-foreground">
                        New endpoints for AI pull request summaries are now available. 
                     </span>
                     <button className="text-[12px] text-emerald-400 hover:underline w-fit">
                        Explore new capabilities
                     </button>
                  </div>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
