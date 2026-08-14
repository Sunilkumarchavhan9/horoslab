import React from "react";
import { Server, Cpu, Database, Network, Activity, ArrowUpRight, ArrowDownRight, HardDrive, ShieldCheck } from "lucide-react";

export function ObservePerformanceView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col border-b border-border pb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Infrastructure Performance</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Deep system-level telemetry across hardware, databases, queues, and latency.
          </p>
        </div>

        {/* Fleet KPIs */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Fleet Telemetry</h2>
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm">
             <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
               
               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global P99 Latency</span>
                 <div className="flex items-center justify-between">
                    <span className="text-[18px] font-bold text-foreground">142ms</span>
                    <span className="text-[11px] font-mono border border-foreground bg-muted/20 px-1 rounded-sm text-foreground flex items-center gap-0.5">
                       <ArrowUpRight className="size-3" /> 12ms
                    </span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total CPU Load</span>
                 <div className="flex items-center justify-between">
                    <span className="text-[18px] font-bold text-foreground">42.5%</span>
                    <span className="text-[11px] font-mono border border-border bg-muted/50 px-1 rounded-sm text-muted-foreground flex items-center gap-0.5">
                       <ArrowDownRight className="size-3" /> 2.1%
                    </span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Memory Utilized</span>
                 <div className="flex items-center justify-between">
                    <span className="text-[18px] font-bold text-foreground">24.8 GB</span>
                    <span className="text-[11px] font-mono border border-foreground bg-muted/20 px-1 rounded-sm text-foreground flex items-center gap-0.5">
                       <ArrowUpRight className="size-3" /> 1.2GB
                    </span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2 bg-muted/20">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Active Workers</span>
                 <div className="flex items-center justify-between">
                    <span className="text-[18px] font-bold text-foreground">48 / 50</span>
                    <span className="text-[11px] font-mono border border-border bg-card shadow-sm px-1 rounded-sm text-foreground flex items-center gap-0.5">
                       Near Capacity
                    </span>
                 </div>
               </div>

             </div>
           </div>
        </div>

        {/* Resource Allocation Ledger */}
        <div className="flex flex-col gap-4 mt-2">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Resource Allocation Ledger</h2>
           
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm overflow-hidden">
             
             {/* Table Header */}
             <div className="flex items-center px-6 py-3 bg-muted/30 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <div className="w-[180px]">Subsystem</div>
                <div className="flex-1">CPU Load</div>
                <div className="w-[140px] text-right">Memory</div>
                <div className="w-[120px] text-right">Latency</div>
             </div>

             {/* Table Rows */}
             <div className="flex flex-col divide-y divide-border/50">
                
                <div className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors">
                   <div className="w-[180px] flex items-center gap-2 text-foreground font-medium">
                      <Server className="size-4 text-muted-foreground" /> API Gateway
                   </div>
                   <div className="flex-1 flex flex-col gap-1.5 px-4">
                      <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-foreground w-[12%]" />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">12.0%</span>
                   </div>
                   <div className="w-[140px] flex justify-end">
                      <span className="text-[12px] font-mono text-muted-foreground">1.2 GB</span>
                   </div>
                   <div className="w-[120px] flex justify-end">
                      <span className="text-[12px] font-mono text-foreground">45 ms</span>
                   </div>
                </div>

                <div className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors bg-muted/20">
                   <div className="w-[180px] flex items-center gap-2 text-foreground font-medium">
                      <Activity className="size-4 text-muted-foreground" /> Mission Runtime
                   </div>
                   <div className="flex-1 flex flex-col gap-1.5 px-4">
                      <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-foreground w-[68%]" />
                      </div>
                      <span className="text-[10px] font-mono text-foreground font-bold">68.0%</span>
                   </div>
                   <div className="w-[140px] flex justify-end">
                      <span className="text-[12px] font-mono text-foreground font-bold">14.5 GB</span>
                   </div>
                   <div className="w-[120px] flex justify-end">
                      <span className="text-[12px] font-mono text-foreground">18 ms</span>
                   </div>
                </div>

                <div className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors">
                   <div className="w-[180px] flex items-center gap-2 text-foreground font-medium">
                      <ShieldCheck className="size-4 text-muted-foreground" /> Verification Engine
                   </div>
                   <div className="flex-1 flex flex-col gap-1.5 px-4">
                      <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-foreground w-[34%]" />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">34.0%</span>
                   </div>
                   <div className="w-[140px] flex justify-end">
                      <span className="text-[12px] font-mono text-muted-foreground">6.1 GB</span>
                   </div>
                   <div className="w-[120px] flex justify-end">
                      <span className="text-[12px] font-mono text-foreground border border-foreground bg-muted/30 px-1 rounded-sm">240 ms</span>
                   </div>
                </div>

                <div className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors">
                   <div className="w-[180px] flex items-center gap-2 text-foreground font-medium">
                      <Database className="size-4 text-muted-foreground" /> Vector Memory
                   </div>
                   <div className="flex-1 flex flex-col gap-1.5 px-4">
                      <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-foreground w-[8%]" />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">8.0%</span>
                   </div>
                   <div className="w-[140px] flex justify-end">
                      <span className="text-[12px] font-mono text-foreground">3.0 GB</span>
                   </div>
                   <div className="w-[120px] flex justify-end">
                      <span className="text-[12px] font-mono text-muted-foreground">4 ms</span>
                   </div>
                </div>

             </div>
           </div>
        </div>

        {/* Infrastructure Map (Nodes list) */}
        <div className="flex flex-col gap-4 mt-2">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Infrastructure Map</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                       <Network className="size-4 text-muted-foreground" /> Network Topology
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                       <div className="size-1.5 rounded-full bg-foreground" /> OK
                    </span>
                 </div>
                 <ul className="flex flex-col gap-2 text-[12px] text-muted-foreground font-mono">
                    <li className="flex justify-between"><span>us-east-1a</span> <span>Healthy</span></li>
                    <li className="flex justify-between"><span>us-east-1b</span> <span>Healthy</span></li>
                    <li className="flex justify-between text-foreground"><span>eu-west-1</span> <span>Degraded</span></li>
                 </ul>
              </div>

              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                       <HardDrive className="size-4 text-muted-foreground" /> Persistent Storage
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                       <div className="size-1.5 rounded-full bg-foreground" /> OK
                    </span>
                 </div>
                 <ul className="flex flex-col gap-2 text-[12px] text-muted-foreground font-mono">
                    <li className="flex justify-between"><span>PostgreSQL (Primary)</span> <span>42% Util</span></li>
                    <li className="flex justify-between"><span>Redis Cache</span> <span>88% Util</span></li>
                    <li className="flex justify-between"><span>S3 Artifacts</span> <span>4.2 TB</span></li>
                 </ul>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}
