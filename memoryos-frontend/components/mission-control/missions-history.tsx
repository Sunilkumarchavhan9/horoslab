"use client";

import { useState } from "react";
import { Search, Filter, Calendar, Clock, User, Building, CheckCircle2, XCircle, ArrowDown, Play, ChevronDown } from "lucide-react";
import { RealityFabricShell } from "./reality-fabric-shell";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { cn } from "@/lib/utils";

type HistoryEvent = {
 id: string;
 missionName: string;
 institution: string;
 owner: string;
 date: string;
 duration: string;
 status: "PASS" | "FAIL";
 nodes: { label: string; time: string; status: "success" | "error" | "pending" }[];
};

const MOCK_HISTORY: HistoryEvent[] = [
 {
 id: "hist-01",
 missionName: "Auth Service Migration",
 institution: "Engineering",
 owner: "HOROS Planner",
 date: "Yesterday",
 duration: "14m 23s",
 status: "PASS",
 nodes: [
 { label: "Mission Started", time: "10:00 AM", status: "success" },
 { label: "Code Modified (3 files)", time: "10:05 AM", status: "success" },
 { label: "Verification PASS", time: "10:12 AM", status: "success" },
 { label: "Settlement Complete", time: "10:14 AM", status: "success" },
 { label: "Institution Updated", time: "10:14 AM", status: "success" }
 ]
 },
 {
 id: "hist-02",
 missionName: "Database Schema Update",
 institution: "Data Platform",
 owner: "HOROS Planner",
 date: "Oct 24",
 duration: "4m 12s",
 status: "FAIL",
 nodes: [
 { label: "Mission Started", time: "02:00 PM", status: "success" },
 { label: "Schema Generated", time: "02:02 PM", status: "success" },
 { label: "Verification FAIL (Index missing)", time: "02:04 PM", status: "error" },
 { label: "Mission Terminated", time: "02:04 PM", status: "error" }
 ]
 },
];

export function MissionsHistory({ onViewMission }: { onViewMission?: (id: string) => void }) {
 const [query, setQuery] = useState("");
 const [expandedId, setExpandedId] = useState<string | null>("hist-01");

 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
 const textMuted = isDark ? "text-[#F0EFE2]/50" : "text-foreground/50";

 return (
 <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
 
 {/* Header */}
 <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-[#F0EFE2]" : "text-foreground")}>Mission History</h1>
 </div>
 <p className={cn("text-[13px] mt-1", textMuted)}>Linear timeline of past completed missions.</p>
 </div>
 
 <div className="flex items-center gap-6">
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Total</span>
 <span className={cn("text-[18px] font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>124</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Passed</span>
 <span className={cn("text-[18px] font-semibold text-green-500")}>118</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Failed</span>
 <span className={cn("text-[18px] font-semibold text-red-500")}>6</span>
 </div>
 </div>
 </div>
 </header>

 <div className="flex flex-1 overflow-hidden">
 
 {/* Left Sidebar - Filters */}
 <div className={cn("w-[240px] shrink-0 border-r p-6 space-y-6 overflow-y-auto custom-scrollbar hidden md:block", isDark ? "border-white/10" : "border-border")}>
 <div className="space-y-3">
 <h3 className={cn("text-[12px] font-semibold uppercase tracking-wider opacity-60", isDark ? "text-[#F0EFE2]" : "text-foreground")}>Filters</h3>
 <div className="space-y-2">
 <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border", isDark ? "bg-card/5 border-white/10 text-[#F0EFE2]" : "bg-muted border-border text-foreground")}>
 <div className="flex items-center gap-2"><Building className="size-3.5 opacity-70" /> Institution</div>
 <ChevronDown className="size-3.5 opacity-50" />
 </button>
 <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border border-transparent hover:border-border dark:hover:border-white/10", isDark ? "text-[#F0EFE2]" : "text-foreground hover:bg-accent")}>
 <div className="flex items-center gap-2"><Calendar className="size-3.5 opacity-70" /> Date Range</div>
 <ChevronDown className="size-3.5 opacity-50" />
 </button>
 <button className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border border-transparent hover:border-border dark:hover:border-white/10", isDark ? "text-[#F0EFE2]" : "text-foreground hover:bg-accent")}>
 <div className="flex items-center gap-2"><User className="size-3.5 opacity-70" /> Owner</div>
 <ChevronDown className="size-3.5 opacity-50" />
 </button>
 </div>
 </div>
 
 <div className="space-y-3">
 <h3 className={cn("text-[12px] font-semibold uppercase tracking-wider opacity-60", isDark ? "text-[#F0EFE2]" : "text-foreground")}>Status</h3>
 <div className="flex flex-col gap-1">
 <label className={cn("flex items-center gap-2 text-[13px] cursor-pointer group", isDark ? "text-[#F0EFE2]" : "text-foreground")}>
 <input type="checkbox" defaultChecked className="rounded border-black/20 text-[#0f52ff] focus:ring-[#0f52ff]" />
 <span className="group-hover:opacity-100 opacity-80 transition-opacity">PASS (118)</span>
 </label>
 <label className={cn("flex items-center gap-2 text-[13px] cursor-pointer group", isDark ? "text-[#F0EFE2]" : "text-foreground")}>
 <input type="checkbox" defaultChecked className="rounded border-black/20 text-[#0f52ff] focus:ring-[#0f52ff]" />
 <span className="group-hover:opacity-100 opacity-80 transition-opacity">FAIL (6)</span>
 </label>
 </div>
 </div>
 </div>

 {/* Main Content - Timeline feed */}
 <div className="flex-1 flex flex-col overflow-hidden">
 <div className={cn("px-6 py-6 border-b flex items-center gap-6 shrink-0", isDark ? "border-white/10" : "border-border")}>
 <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-[13px] w-full max-w-md border transition-colors cursor-text", isDark ? "bg-[#121212] border-white/10 text-[#F0EFE2]" : "bg-card border-border text-foreground")}>
 <Search className="size-4 shrink-0 opacity-50" />
 <input 
 type="text" 
 placeholder="Search history..." 
 value={query}
 onChange={e => setQuery(e.target.value)}
 className="outline-none bg-transparent w-full placeholder:opacity-50" 
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
 {MOCK_HISTORY.map(event => (
 <div key={event.id} className="flex gap-6">
 
 {/* Left Time Column */}
 <div className="w-24 shrink-0 pt-1 text-right">
 <div className={cn("text-[13px] font-medium", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{event.date}</div>
 <div className={cn("text-[11px] mt-0.5", textMuted)}>{event.duration}</div>
 </div>

 {/* Timeline Line */}
 <div className="relative flex flex-col items-center">
 <div className={cn("size-3 rounded-full z-10 mt-1.5", event.status === "PASS" ? "bg-green-500" : "bg-red-500")} />
 <div className={cn("w-px h-full absolute top-3", isDark ? "bg-card/10" : "bg-black/10")} />
 </div>

 {/* Event Card */}
 <div className="flex-1 pb-8 pr-2">
 <div 
 onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
 className={cn("rounded-md border p-6 cursor-pointer transition-all hover:", bgCard, expandedId === event.id ? "ring-1 ring-black/10 dark:ring-white/20" : "")}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 {event.status === "PASS" ? <CheckCircle2 className="size-4 text-green-500" /> : <XCircle className="size-4 text-red-500" />}
 <h3 className={cn("font-semibold text-[15px]", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{event.missionName}</h3>
 </div>
 <button onClick={(e) => { e.stopPropagation(); onViewMission?.(event.id); }} className={cn("px-3 py-1 text-[12px] font-medium rounded-md border flex items-center gap-1.5 transition-colors", isDark ? "hover:bg-card/10 border-white/20 text-[#F0EFE2]" : "hover:bg-accent border-border text-foreground")}>
 <Play className="size-3" /> Replay
 </button>
 </div>

 <div className="flex items-center gap-6 text-[12px] mb-4">
 <span className={cn("flex items-center gap-1.5", textMuted)}><Building className="size-3.5" /> {event.institution}</span>
 <span className={cn("flex items-center gap-1.5", textMuted)}><User className="size-3.5" /> {event.owner}</span>
 </div>

 {expandedId === event.id && (
 <div className="mt-4 pt-4 border-t border-border dark:border-white/5">
 <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
 
 {/* Inner Nodes */}
 <div className="flex flex-col gap-0 pl-1">
 {event.nodes.map((node, i) => (
 <div key={i} className="flex flex-col items-start pb-4 last:pb-0">
 <div className="flex items-center gap-3 relative">
 <div className="flex items-center justify-center w-6 h-6 shrink-0 relative z-10">
 <ArrowDown className="size-3.5 text-foreground/30 dark:text-[#F0EFE2]/30" />
 </div>
 <div className={cn("px-3 py-1.5 rounded border text-[13px]", isDark ? "bg-[#1a1a1a] border-white/5 text-[#F0EFE2]" : "bg-card border-border text-foreground")}>
 <span className="font-medium mr-2">{node.label}</span>
 <span className="opacity-50 text-[11px]">{node.time}</span>
 </div>
 </div>
 </div>
 ))}
 </div>

 </div>
 </div>
 )}
 </div>
 </div>

 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
