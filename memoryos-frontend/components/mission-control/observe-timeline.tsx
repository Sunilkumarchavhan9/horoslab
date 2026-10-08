"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
 Activity, 
 Filter,
 Search,
 CheckCircle2,
 AlertTriangle,
 PlayCircle,
 ShieldCheck,
 Building,
 Bot,
 Zap,
 ArrowRight,
 Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, useAnimation } from "framer-motion";
import { CommandBar, SectionHeader, InspectorModal } from "./observe-shared-components";

type EventType = "Mission" | "Verification" | "Institution" | "Agent" | "Deployment" | "Security";

interface RiverEvent {
 id: string;
 type: EventType;
 title: string;
 time: string;
 status: "success" | "warning" | "error" | "info";
 description: string;
}

const MOCK_EVENTS: RiverEvent[] = [
 { id: "1", type: "Institution", title: "Engineering Updated", time: "09:30:12", status: "info", description: "Policy changes merged to Engineering." },
 { id: "2", type: "Mission", title: "Release Mission Created", time: "09:31:05", status: "success", description: "Deploy PR #412 to Production." },
 { id: "3", type: "Agent", title: "Worker Assigned", time: "09:32:15", status: "info", description: "Claude 3.5 Sonnet assigned to Release Mission." },
 { id: "4", type: "Verification", title: "Test Suite Failed", time: "09:33:45", status: "error", description: "E2E tests failed on staging environment." },
 { id: "5", type: "Agent", title: "Worker Resolved Issue", time: "09:34:10", status: "success", description: "Agent patched failing tests autonomously." },
 { id: "6", type: "Verification", title: "Security Scan PASS", time: "09:35:00", status: "success", description: "No vulnerabilities detected in payload." },
 { id: "7", type: "Deployment", title: "Production Deployed", time: "09:35:45", status: "success", description: "Version v2.1.4 successfully rolled out." },
 { id: "8", type: "Mission", title: "Mission Completed", time: "09:36:12", status: "success", description: "Release Mission concluded successfully." },
 { id: "9", type: "Institution", title: "Learning Extracted", time: "09:37:00", status: "info", description: "Agent behavior model updated from mission." },
 { id: "10", type: "Security", title: "IAM Lease Revoked", time: "09:37:05", status: "info", description: "Temporary deploy lease revoked from agent." },
];

const FILTER_TAGS = ["All", "Institution", "Mission", "Agent", "Verification", "Deployment", "Security"];

const EventIcon = ({ type, status }: { type: string, status: string }) => {
 const getIcon = () => {
 switch (type) {
 case "Institution": return Building;
 case "Mission": return PlayCircle;
 case "Agent": return Bot;
 case "Verification": return ShieldCheck;
 case "Deployment": return Zap;
 case "Security": return Database;
 default: return Activity;
 }
 };
 const Icon = getIcon();
 
 return (
 <div className={cn(
 "size-10 rounded-full flex items-center justify-center shrink-0 border relative z-10 bg-card dark:bg-[#121212]",
 status === "success" ? "border-emerald-500/40 text-emerald-500" :
 status === "warning" ? "border-amber-500/40 text-amber-500" :
 status === "error" ? "border-red-500/40 text-red-500" :
 "border-[#0f52ff]/40 text-[#0f52ff]"
 )}>
 <Icon className="size-5" />
 </div>
 );
};

export function ObserveTimeline() {
 const [activeFilter, setActiveFilter] = useState("All");
 const [inspectorOpen, setInspectorOpen] = useState(false);
 const [inspectorTarget, setInspectorTarget] = useState<RiverEvent | null>(null);
 
 const riverRef = useRef<HTMLDivElement>(null);
 const { scrollXProgress } = useScroll({ container: riverRef });

 const filteredEvents = MOCK_EVENTS.filter(e => activeFilter === "All" || e.type === activeFilter);

 const handleEventClick = (event: RiverEvent) => {
 setInspectorTarget(event);
 setInspectorOpen(true);
 };

 return (
 <div className="flex flex-col h-full w-full bg-[#FBFBFB] dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-2">
 <Activity className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold tracking-wide">Observe / Timeline</span>
 </div>
 </CommandBar>

 <div className="flex-1 flex flex-col h-full relative z-0">
 <div className="px-[120px] pt-10 shrink-0 mx-auto w-full">
 <SectionHeader 
 title="Organization Timeline" 
 description="The live, horizontal Activity River showing exactly what is happening across the entire autonomous enterprise in real time."
 />
 
 <div className="flex items-center gap-3 mb-10 overflow-x-auto custom-scrollbar pb-2">
 <Filter className="size-4 text-foreground/40 dark:text-[#F0EFE2]/40 mr-2 shrink-0" />
 {FILTER_TAGS.map(tag => (
 <button
 key={tag}
 onClick={() => setActiveFilter(tag)}
 className={cn(
 "px-6 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap shrink-0 border",
 activeFilter === tag 
 ? "bg-black text-[#F0EFE2] dark:bg-white dark:text-black border-transparent "
 : "bg-card/50 dark:bg-[#121212]/50 border-border dark:border-white/10 text-foreground/60 dark:text-[#F0EFE2]/60 hover:border-black/30 dark:hover:border-white/30"
 )}
 >
 {tag}
 </button>
 ))}
 </div>
 </div>

 {/* The Activity River */}
 <div 
 ref={riverRef}
 className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center px-20 relative w-full h-full pb-20"
 >
 {/* River Background Line */}
 <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent -translate-y-1/2 pointer-events-none" />
 
 <div className="flex items-center gap-32 relative">
 {filteredEvents.map((event, index) => {
 const isTop = index % 2 === 0;
 return (
 <motion.div 
 key={event.id}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: index * 0.1, type: "spring" }}
 className="relative flex flex-col items-center group cursor-pointer shrink-0"
 onClick={() => handleEventClick(event)}
 >
 {/* Event Card */}
 <div className={cn(
 "absolute w-64 p-6 rounded-md bg-card/90 dark:bg-[#121212]/90 backdrop-blur-xl border border-border dark:border-white/10 transition-all group-hover:scale-105 group-hover:shadow-xl z-20 left-1/2 -translate-x-1/2",
 isTop ? "bottom-16" : "top-16"
 )}>
 <div className="flex items-center justify-between mb-3">
 <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">{event.type}</span>
 <span className="text-[12px] font-mono font-bold text-[#0f52ff]">{event.time}</span>
 </div>
 <h4 className="text-[15px] font-bold tracking-tight mb-2 leading-snug">{event.title}</h4>
 <p className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60 leading-relaxed">{event.description}</p>
 </div>

 {/* Node Connector Line */}
 <div className={cn(
 "w-px h-16 bg-gradient-to-b absolute left-1/2 -translate-x-1/2",
 isTop ? "bottom-0 from-black/20 dark:from-white/20 to-transparent" : "top-0 from-transparent to-black/20 dark:to-white/20"
 )} />

 {/* Node Icon */}
 <EventIcon type={event.type} status={event.status} />

 {/* Flow Arrow */}
 {index < filteredEvents.length - 1 && (
 <div className="absolute top-1/2 -right-16 -translate-y-1/2 text-foreground/20 dark:text-[#F0EFE2]/20">
 <ArrowRight className="size-5" />
 </div>
 )}
 </motion.div>
 );
 })}
 </div>
 </div>
 </div>

 <InspectorModal 
 isOpen={inspectorOpen} 
 onClose={() => setInspectorOpen(false)} 
 title="Event Inspector"
 subtitle={inspectorTarget ? `${inspectorTarget.type} Event at ${inspectorTarget.time}` : ""}
 >
 {inspectorTarget && (
 <div className="space-y-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 flex items-center gap-6">
 <EventIcon type={inspectorTarget.type} status={inspectorTarget.status} />
 <div className="flex flex-col">
 <h4 className="text-[20px] font-bold tracking-tight">{inspectorTarget.title}</h4>
 <p className="text-[14px] text-foreground/60 dark:text-[#F0EFE2]/60 mt-1">{inspectorTarget.description}</p>
 </div>
 </div>

 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card/50 dark:bg-[#121212]/50 space-y-4">
 <h4 className="text-[13px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">Raw Telemetry</h4>
 <pre className="font-mono text-[12px] p-6 rounded-md bg-black text-[#F0EFE2] dark:bg-[#050505] overflow-x-auto">
{`{
 "eventId": "ev_${inspectorTarget.id}_${Date.now()}",
 "timestamp": "2026-07-26T${inspectorTarget.time}Z",
 "source": "${inspectorTarget.type.toLowerCase()}_runtime",
 "level": "${inspectorTarget.status === 'success' ? 'INFO' : inspectorTarget.status === 'error' ? 'ERROR' : 'WARN'}",
 "message": "${inspectorTarget.description}",
 "metadata": {
 "organization": "Acme Corp",
 "institution": "Engineering"
 }
}`}
 </pre>
 </div>
 </div>
 )}
 </InspectorModal>
 </div>
 );
}
