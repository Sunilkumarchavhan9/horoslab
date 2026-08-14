import React from "react";
import { NodePulse, HoverLift } from "./animations";

export type NodeCardProps = {
 id: string;
 label: string;
 type: string;
 status: "active" | "idle" | "error";
 className?: string;
};

export function NodeCard({ id, label, type, status, className = "" }: NodeCardProps) {
 const isRunning = status === "active";
 const pulseColor = status === "error" ? "#ef4444" : "#0f52ff";
 
 return (
 <HoverLift className={`group relative min-w-[200px] bg-card border border-border rounded-[6px] p-6 flex flex-col items-center justify-center text-center ${className}`}>
 <NodePulse active={isRunning} color={pulseColor}>
 <div className={`p-3 rounded-full mb-3 border ${
 status === 'active' ? 'bg-[#0f52ff]/10 border-[#0f52ff]/20 text-[#0f52ff]' :
 status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
 'bg-muted border-border text-foreground'
 }`}>
 <div className="size-4 bg-current rounded-sm opacity-80" />
 </div>
 </NodePulse>
 <h4 className="text-[14px] font-semibold text-foreground leading-tight mb-1">{label}</h4>
 <div className="text-[10px] text-foreground/50 font-mono tracking-tight uppercase px-1.5 py-0.5 bg-muted rounded">
 {type}
 </div>
 </HoverLift>
 );
}
