"use client";

import { useRealityStore } from "../../runtime/store";
import { GitCommit, MessageSquare, Box, Activity, Target, CheckCircle2, ChevronRight, Zap, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { RealityEntityType } from "../../entities/types";

const EVENTS = [
 { id: "ev_1", type: "repository" as RealityEntityType, icon: <GitCommit className="size-4" />, title: "GitHub Push", subtitle: "memoryos-core", time: "10:42 AM", color: "text-foreground dark:text-[#eee]" },
 { id: "ev_2", type: "mission" as RealityEntityType, icon: <Target className="size-4" />, title: "Mission Created", subtitle: "Security Audit", time: "10:43 AM", color: "text-amber-500" },
 { id: "ev_3", type: "service" as RealityEntityType, icon: <Activity className="size-4" />, title: "Planner Started", subtitle: "Analyzing requirements", time: "10:43 AM", color: "text-blue-500" },
 { id: "ev_4", type: "agent" as RealityEntityType, icon: <Box className="size-4" />, title: "Worker Assigned", subtitle: "Worker #42", time: "10:44 AM", color: "text-blue-500" },
 { id: "ev_5", type: "evidence" as RealityEntityType, icon: <CheckCircle2 className="size-4" />, title: "Verification PASS", subtitle: "No vulnerabilities", time: "10:50 AM", color: "text-emerald-500" },
 { id: "ev_6", type: "channel" as RealityEntityType, icon: <MessageSquare className="size-4" />, title: "Notification Sent", subtitle: "#engineering-alerts", time: "10:51 AM", color: "text-rose-500" },
];

export function RealityStreamMode() {
 const { selection, setSelection, searchQuery } = useRealityStore();

 const filteredEvents = EVENTS.filter(e => 
 e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
 e.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
 
 <div className="flex items-center justify-between px-8 py-6 border-b border-border dark:border-[#333]">
 <div className="flex items-center gap-3">
 <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
 <Activity className="size-4" />
 </div>
 <div>
 <h1 className="text-[18px] font-bold leading-none">Event Stream</h1>
 <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Live horizontal stream of all events flowing through the reality fabric.</p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <button className="flex items-center gap-2 px-4 py-2 border border-[#ccc] dark:border-[#555] rounded-md text-[13px] font-bold hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 <Filter className="size-4" /> Filters
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[13px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors">
 <Activity className="size-4" /> Live
 </button>
 </div>
 </div>

 <div className="flex flex-col w-full h-full overflow-hidden relative">
 <div className="flex items-center h-full px-8 gap-8 min-w-max">
 
 {filteredEvents.map((ev, idx) => (
 <div key={ev.id} className="flex items-center gap-8 h-full relative group">
 
 <div 
 onClick={() => setSelection({ type: ev.type, id: ev.id, sourceView: 'stream' })}
 className={cn(
 "flex flex-col w-[260px] p-6 border transition-colors cursor-pointer bg-card dark:bg-[#111]",
 selection?.id === ev.id ? "border-[#111] dark:border-border ring-1 ring-[#111] dark:ring-[#eee]" : "border-border dark:border-[#333] hover:border-[#ccc] dark:hover:border-[#555]"
 )}
 >
 <div className="flex items-center justify-between mb-4">
 <div className={cn("p-2 bg-muted/50 dark:bg-[#151515]", ev.color)}>
 {ev.icon}
 </div>
 <span className="text-[12px] text-muted-foreground dark:text-muted-foreground font-mono font-bold">{ev.time}</span>
 </div>
 <span className="text-[16px] font-bold text-foreground dark:text-[#eee] mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ev.title}</span>
 <span className="text-[13px] text-muted-foreground dark:text-muted-foreground truncate font-medium">{ev.subtitle}</span>
 </div>

 {idx < filteredEvents.length - 1 && (
 <div className="flex items-center text-muted-foreground dark:text-muted-foreground relative w-[60px]">
 <div className="w-full h-px bg-[#eee] dark:bg-[#333] relative overflow-hidden">
 <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-500 animate-[shimmer_1.5s_infinite]" />
 </div>
 <ChevronRight className="size-4 absolute right-[-8px] text-[#ccc] dark:text-muted-foreground bg-card dark:bg-[#111]" />
 </div>
 )}
 </div>
 ))}
 
 {filteredEvents.length > 0 && (
 <div className="flex items-center gap-8 opacity-50 relative group">
 <div className="flex items-center text-muted-foreground dark:text-muted-foreground w-[60px]">
 <div className="w-full h-px bg-[#eee] dark:bg-[#333] border-dashed border-b" />
 </div>
 <div className="size-12 border-2 border-dashed border-[#ccc] dark:border-[#555] flex items-center justify-center animate-pulse group-hover:border-blue-500 transition-colors">
 <Zap className="size-5 text-[#ccc] dark:text-muted-foreground group-hover:text-blue-500 transition-colors" />
 </div>
 </div>
 )}

 </div>
 </div>
 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'stream',
 title: 'Event Stream',
 component: RealityStreamMode,
});
