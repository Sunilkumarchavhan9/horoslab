import React from "react";
import { Blocks, Search, Filter, Settings, Activity, GitBranch, Cloud, Database, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperExtensionsView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto p-12 custom-scrollbar">
      
      <div className="flex flex-col max-w-5xl mx-auto w-full gap-8">
         
         <div className="flex flex-col gap-4">
            <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-tight">
              Extensions Registry
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-3xl">
              Extensions expand the programmable surface of the Institution. They wrap external APIs, provide custom internal tools, and map institutional capabilities to executing agents under strict governance.
            </p>
         </div>

         {/* Toolbar */}
         <div className="flex items-center gap-4 mt-4 border-b border-border pb-6">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search extensions (e.g., Slack, Datadog, Internal Auth)..." 
                 className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2 text-[13px] focus:outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground" 
               />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-md text-[13px] font-medium text-foreground hover:bg-muted/30 transition-colors">
               <Filter className="size-3.5" /> Filter
            </button>
            <div className="flex-1" />
            <button className="text-[13px] bg-foreground hover:bg-neutral-200 text-background font-medium px-4 py-2 rounded-md transition-colors">
               Build Extension
            </button>
         </div>

         {/* Extensions Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Extension 1 */}
            <div className="flex flex-col border border-border bg-card rounded-md overflow-hidden hover:border-border/80 hover:border-border transition-colors group">
               <div className="flex items-start justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-foreground flex items-center justify-center rounded-md">
                        <GitBranch className="size-6 text-background" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-foreground flex items-center gap-2">
                           GitHub Connector
                        </span>
                        <span className="text-[12px] text-muted-foreground font-mono">@horos/ext-github v2.4.1</span>
                     </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded-sm border border-emerald-500/20">
                     Active
                  </span>
               </div>
               
               <div className="p-5 flex flex-col gap-4">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                     Maps GitHub repositories, pull requests, and issues to institutional memory. Allows agents to autonomously review code and merge PRs.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capabilities</span>
                        <span className="text-[12px] text-foreground">12 mapped</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage (7d)</span>
                        <span className="text-[12px] text-foreground">45.2K invocations</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-muted/30 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                     <Settings className="size-3" /> Configuration
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                     <Activity className="size-3" /> View Metrics
                  </button>
               </div>
            </div>

            {/* Extension 2 */}
            <div className="flex flex-col border border-border bg-card rounded-md overflow-hidden hover:border-border/80 hover:border-border transition-colors group">
               <div className="flex items-start justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-blue-500 flex items-center justify-center rounded-md">
                        <Cloud className="size-6 text-foreground" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-foreground flex items-center gap-2">
                           AWS Infra Config
                        </span>
                        <span className="text-[12px] text-muted-foreground font-mono">@horos/ext-aws v1.0.2</span>
                     </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded-sm border border-emerald-500/20">
                     Active
                  </span>
               </div>
               
               <div className="p-5 flex flex-col gap-4">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                     Manages institutional cloud infrastructure. Requires strict verification policies (POL-SEC-01) for any destructive actions.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capabilities</span>
                        <span className="text-[12px] text-foreground">48 mapped</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage (7d)</span>
                        <span className="text-[12px] text-foreground">1.2K invocations</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-muted/30 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                     <Settings className="size-3" /> Configuration
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                     <Activity className="size-3" /> View Metrics
                  </button>
               </div>
            </div>

            {/* Extension 3 */}
            <div className="flex flex-col border border-border bg-card rounded-md overflow-hidden hover:border-border/80 hover:border-border transition-colors group">
               <div className="flex items-start justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-purple-500 flex items-center justify-center rounded-md">
                        <Database className="size-6 text-foreground" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-foreground flex items-center gap-2">
                           Internal Data Warehouse
                        </span>
                        <span className="text-[12px] text-muted-foreground font-mono">@internal/ext-dwh v4.0.0</span>
                     </div>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-mono rounded-sm border border-orange-500/20">
                     Degraded
                  </span>
               </div>
               
               <div className="p-5 flex flex-col gap-4">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                     Custom internal plugin connecting HOROS to the proprietary data warehouse. Exposes querying capabilities to analytical agents.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capabilities</span>
                        <span className="text-[12px] text-foreground">3 mapped</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage (7d)</span>
                        <span className="text-[12px] text-foreground">114.8K invocations</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-muted/30 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 text-[11px] text-orange-400 transition-colors">
                     <Settings className="size-3" /> View Error Logs
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                     <Activity className="size-3" /> View Metrics
                  </button>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
