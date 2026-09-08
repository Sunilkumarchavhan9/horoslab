"use client";

import { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { MissionRow } from "./types";
import { X, Play, Square, FastForward } from "lucide-react";

export interface ActiveMissionInspectorProps {
 mission: MissionRow;
 onClose: () => void;
 activeTab: string;
 setActiveTab: Dispatch<SetStateAction<string>>;
 isDark: boolean;
 textMuted: string;
}

export function ActiveMissionInspector({
 mission,
 onClose,
 activeTab,
 setActiveTab,
 isDark,
 textMuted,
}: ActiveMissionInspectorProps) {
 return (
 <div className={cn("flex flex-col h-full w-full", isDark ? "bg-[#121212]" : "bg-card")}>
 <div className={cn("px-6 py-6 border-b shrink-0 flex items-start justify-between", isDark ? "border-white/10" : "border-border")}>
 <div>
 <h2 className={cn("text-[15px] font-semibold tracking-tight", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{mission.name}</h2>
 <p className={cn("text-[12px] mt-0.5", textMuted)}>Status: {mission.status.toUpperCase()}</p>
 </div>
 <button 
 onClick={onClose}
 className={cn("p-1.5 rounded-md transition-colors", isDark ? "hover:bg-card/10 text-[#F0EFE2]/50 hover:text-[#F0EFE2]" : "hover:bg-black/10 text-foreground/50 hover:text-foreground")}
 >
 <X className="size-4" />
 </button>
 </div>

 <div className={cn("flex px-6 gap-6 border-b shrink-0 overflow-x-auto custom-scrollbar", isDark ? "border-white/10" : "border-border")}>
 {["Mission", "Institution", "Workers", "Evidence", "Logs"].map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "py-3 text-[12.5px] font-medium transition-all relative whitespace-nowrap",
 activeTab === tab ? (isDark ? "text-[#F0EFE2]" : "text-foreground") : cn(textMuted, isDark ? "hover:text-[#F0EFE2]/70" : "hover:text-foreground/70")
 )}
 >
 {tab}
 {activeTab === tab && (
 <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", isDark ? "bg-card" : "bg-black")} />
 )}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 <div className="space-y-4">
 <div className={cn("p-3 rounded-md border text-[13px]", isDark ? "bg-card/[0.02] border-white/10" : "bg-muted/50 border-border")}>
 <div className="flex justify-between mb-2">
 <span className={textMuted}>Owner</span>
 <span className={cn("font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{mission.planner}</span>
 </div>
 <div className="flex justify-between mb-2">
 <span className={textMuted}>Runtime</span>
 <span className={cn("font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{mission.started}</span>
 </div>
 <div className="flex justify-between">
 <span className={textMuted}>Risk Level</span>
 <span className={cn("font-semibold", mission.risk === "High" ? "text-red-500" : (isDark ? "text-[#F0EFE2]" : "text-foreground"))}>{mission.risk}</span>
 </div>
 </div>

 {activeTab === "Mission" && (
 <div className="space-y-4 mt-6">
 <div className="space-y-2">
 <div className={cn("text-[12px] font-semibold uppercase tracking-wider", textMuted)}>Live Progress</div>
 <div className={cn("w-full rounded-full h-2 mt-1 relative overflow-hidden", isDark ? "bg-card/10" : "bg-black/10")}>
 <div className={cn("h-full rounded-full transition-all duration-500", mission.status === "running" ? "bg-[#0f52ff]" : "bg-green-500")} style={{ width: `${mission.progress}%` }}></div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 pt-4">
 <button className="flex items-center justify-center gap-1.5 p-2 rounded-md border text-[12px] font-medium transition-colors border-border dark:border-white/10 hover:bg-accent dark:hover:bg-card/5">
 <Play className="size-3.5" /> Resume
 </button>
 <button className="flex items-center justify-center gap-1.5 p-2 rounded-md border text-[12px] font-medium transition-colors border-border dark:border-white/10 hover:bg-accent dark:hover:bg-card/5">
 <Square className="size-3.5" /> Terminate
 </button>
 </div>
 </div>
 )}
 
 {activeTab !== "Mission" && (
 <div className={cn("flex flex-col items-center justify-center py-10 text-center opacity-50", textMuted)}>
 <FastForward className="size-8 mb-2 opacity-50" />
 <p className="text-[13px] font-medium">{activeTab} details will stream here.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
