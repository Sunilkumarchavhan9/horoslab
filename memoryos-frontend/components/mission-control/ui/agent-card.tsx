import React from "react";
import { Bot } from "lucide-react";
import { HoverLift, GlowPulse } from "./animations";
import { StatusBadge } from "./status-badge";

export type AgentCardProps = {
 name: string;
 status: "idle" | "running" | "error";
 taskCount?: number;
 cpuUsage?: number;
 capabilities?: string[];
 className?: string;
};

export function AgentCard({
 name,
 status,
 taskCount = 0,
 cpuUsage = 0,
 capabilities = [],
 className = "",
}: AgentCardProps) {
 return (
 <HoverLift className={`group relative w-full bg-card border border-border rounded-[6px] overflow-hidden ${className}`}>
 {status === "running" && (
 <div className="absolute top-0 left-0 w-full h-0.5 overflow-hidden z-10">
 <div className="w-full h-full bg-[#0f52ff] animate-[shimmer_2s_infinite]" style={{
 backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)"
 }} />
 </div>
 )}
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-md bg-muted border border-border text-[#0f52ff]">
 <Bot className="size-5" />
 </div>
 <div>
 <h4 className="text-[14px] font-semibold text-foreground leading-tight">{name}</h4>
 <p className="text-[11px] text-foreground/50 mt-0.5 font-mono tracking-tight">ID: {name.toLowerCase().replace(/ /g, '-')}</p>
 </div>
 </div>
 <StatusBadge status={status} />
 </div>

 <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/50 rounded-[6px] border border-border">
 <div>
 <div className="text-[10px] text-foreground/40 font-medium uppercase mb-1">Active Tasks</div>
 <div className="text-[14px] font-semibold text-foreground">{taskCount}</div>
 </div>
 <div>
 <div className="text-[10px] text-foreground/40 font-medium uppercase mb-1">Compute</div>
 <div className="text-[14px] font-semibold text-foreground">{cpuUsage}%</div>
 </div>
 </div>

 {capabilities.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {capabilities.map((cap, i) => (
 <span key={i} className="px-2 py-0.5 text-[10px] bg-muted text-foreground/60 rounded-[4px] font-medium border border-border">
 {cap}
 </span>
 ))}
 </div>
 )}
 </div>
 </HoverLift>
 );
}
