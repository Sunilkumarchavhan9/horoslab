import React from "react";
import { GlowPulse } from "./animations";

export type MissionCardProps = {
 title: string;
 objective: string;
 status: "idle" | "running" | "error" | "success" | "pending";
 progress?: number; // 0-100
 className?: string;
};

export function MissionCard({
 title,
 objective,
 status,
 progress = 0,
 className = "",
}: MissionCardProps) {
 return (
 <GlowPulse active={status === "running"} className={`group w-full bg-card border border-border rounded-[6px] overflow-hidden ${className}`}>
 <div className="p-6 flex flex-col h-full">
 <div className="flex items-start justify-between mb-3">
 <h3 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h3>
 <div className={`size-2.5 rounded-full mt-1 shrink-0 ${
 status === "running" ? "bg-[#0f52ff] animate-pulse" :
 status === "success" ? "bg-emerald-500" :
 status === "error" ? "bg-red-500" :
 status === "pending" ? "bg-amber-500" :
 "bg-black/20"
 }`} />
 </div>
 
 <p className="text-[12px] text-foreground/60 leading-relaxed flex-1 mb-5 line-clamp-2">
 {objective}
 </p>

 {progress > 0 && status !== "idle" && (
 <div className="w-full">
 <div className="flex items-center justify-between text-[10px] font-medium text-foreground/50 mb-1.5 uppercase">
 <span>Progress</span>
 <span>{progress}%</span>
 </div>
 <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
 <div 
 className="h-full bg-[#111] rounded-full transition-all duration-1000 ease-out"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 )}
 </div>
 </GlowPulse>
 );
}
