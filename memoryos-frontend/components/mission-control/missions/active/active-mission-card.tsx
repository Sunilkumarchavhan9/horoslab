"use client";

import { CheckCircle2, PauseCircle, Eye, FastForward, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionRow } from "./types";

export interface ActiveMissionCardProps {
 mission: MissionRow;
 bgCard: string;
 textMuted: string;
 isDark: boolean;
 onViewMission?: (id: string) => void;
 onSelectMission: (mission: MissionRow) => void;
}

export function ActiveMissionCard({
 mission,
 bgCard,
 textMuted,
 isDark,
 onViewMission,
 onSelectMission,
}: ActiveMissionCardProps) {
 return (
 <div className={cn("group rounded-md border p-6 flex flex-col hover: transition-all relative overflow-hidden", bgCard)}>
 {mission.status === "running" && (
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/10">
 <div className="h-full bg-[#0f52ff]" style={{ width: `${mission.progress}%` }} />
 </div>
 )}
 
 <div className="flex justify-between items-start mb-3 mt-1">
 <div className="flex flex-col">
 <h3 className="font-semibold text-[15px]">{mission.name}</h3>
 <span className={cn("text-[12px]", textMuted)}>{mission.institution}</span>
 </div>
 <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase border", 
 mission.status === "running" ? "bg-[#0f52ff]/10 text-[#0f52ff] border-[#0f52ff]/20" : 
 mission.status === "waiting_review" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-muted dark:bg-white/10 text-foreground/60 dark:text-[#F0EFE2]/60 border-transparent"
 )}>
 {mission.status.replace("_", " ")}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-y-4 text-[12px] mb-6">
 <div className="flex flex-col">
 <span className={textMuted}>Planner</span>
 <div className="flex items-center gap-1.5 font-medium mt-0.5">
 <CheckCircle2 className="size-3.5 text-green-500" /> {mission.planner}
 </div>
 </div>
 <div className="flex flex-col">
 <span className={textMuted}>Workers</span>
 <div className="flex items-center gap-1 font-medium mt-0.5">
 {Array.from({ length: Math.min(mission.workers, 3) }).map((_, i) => (
 <div key={i} className="size-4 rounded-full bg-gradient-to-br from-[#0f52ff] to-purple-500 border border-white/20 " />
 ))}
 {mission.workers > 3 && <span className="ml-1 text-[11px] opacity-70">+{mission.workers - 3}</span>}
 </div>
 </div>
 <div className="flex flex-col">
 <span className={textMuted}>Evidence</span>
 <span className="font-medium mt-0.5">{mission.evidence} items</span>
 </div>
 <div className="flex flex-col">
 <span className={textMuted}>Verification</span>
 <span className="font-medium mt-0.5">{mission.status === "running" ? "Running..." : "Idle"}</span>
 </div>
 </div>

 {/* Hover Actions Bar */}
 <div className={cn("absolute bottom-0 left-0 w-full p-3 flex items-center justify-between gap-2 border-t opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200", isDark ? "bg-[#121212] border-white/10" : "bg-card border-border")}>
 <button 
 onClick={(e) => { e.stopPropagation(); onViewMission?.(mission.id); }}
 className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#0f52ff] text-[#F0EFE2] text-[12px] font-medium hover:bg-[#0f52ff]/90 transition-colors"
 >
 <Maximize2 className="size-3.5" /> Workspace
 </button>
 <div className="flex gap-1">
 <button className="p-1.5 rounded-md hover:bg-accent dark:hover:bg-card/10 transition-colors" title="Pause">
 <PauseCircle className="size-4 opacity-70" />
 </button>
 <button onClick={() => onSelectMission(mission)} className="p-1.5 rounded-md hover:bg-accent dark:hover:bg-card/10 transition-colors" title="Inspect">
 <Eye className="size-4 opacity-70" />
 </button>
 <button className="p-1.5 rounded-md hover:bg-accent dark:hover:bg-card/10 transition-colors" title="Timeline">
 <FastForward className="size-4 opacity-70" />
 </button>
 </div>
 </div>
 </div>
 );
}
