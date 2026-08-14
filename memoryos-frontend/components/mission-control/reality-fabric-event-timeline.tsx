"use client";

import { useState } from "react";
import { RealityFabricShell, RealityFabricInspector } from "./reality-fabric-shell";
import { Search, GitBranch, GitMerge, FileCode, CheckCircle2, Bot, PlayCircle, ShieldCheck, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
 id: string;
 time: string;
 title: string;
 source: "GitHub" | "Mission" | "Planner" | "Worker" | "Verification";
 icon: any;
 details: string;
 color: string;
 expandedDetails?: any;
}

const EVENTS: TimelineEvent[] = [
 { id: "e1", time: "11:41 AM", title: "GitHub Push to main", source: "GitHub", icon: GitBranch, details: "3 commits pushed by @alexdev", color: "#24292e" },
 { id: "e2", time: "11:41 AM", title: "Mission Created", source: "Mission", icon: Target, details: "Mission #4922 - Verify Authentication Flow", color: "#0f52ff" },
 { id: "p1", time: "11:41 AM", title: "Robot Scan Started", source: "Worker", icon: Bot, details: "Robot Unit R-452 scanning Warehouse-B", color: "#eab308" },
 { id: "e3", time: "11:42 AM", title: "Planner Started", source: "Planner", icon: PlayCircle, details: "Analyzing changes and building strategy", color: "#8a2be2" },
 { id: "p2", time: "11:42 AM", title: "Sensor Reading Anomaly", source: "Mission", icon: Target, details: "Thermal-Zone-A temperature exceeded threshold", color: "#ef4444" },
 { id: "e4", time: "11:42 AM", title: "Worker Assigned", source: "Worker", icon: Bot, details: "Worker #14 assigned to execution", color: "#f38020" },
 { id: "p3", time: "11:43 AM", title: "Inspection Complete", source: "Verification", icon: ShieldCheck, details: "Physical verification completed for Bay-4-Feed", color: "#22c55e" },
 { id: "e5", time: "11:44 AM", title: "Evidence Recorded", source: "Mission", icon: FileCode, details: "Captured 4 browser traces and 2 logs", color: "#2a7b2a" },
 { id: "e6", time: "11:45 AM", title: "Verification PASS", source: "Verification", icon: ShieldCheck, details: "100% Confidence. Certificate issued.", color: "#2a7b2a" },
];

export function RealityFabricEventTimeline() {
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [expandedId, setExpandedId] = useState<string | null>(null);

 const selectedEvent = EVENTS.find(e => e.id === selectedId);

 // We need to import Target locally if not from lucide-react, let's use GitCommit or something if Target is not imported. 
 // Wait, I didn't import Target above. Let's fix imports.
 
 return (
 <RealityFabricShell
 title="Event Timeline"
 subtitle="Everything entering Reality Fabric in real-time."
 metrics={{ sources: 124, activeEvents: 14, activeMissions: 6, health: 99.8 }}
 rightPanel={
 selectedEvent ? (
 <RealityFabricInspector 
 title={selectedEvent.title} 
 subtitle={selectedEvent.time}
 onClose={() => setSelectedId(null)}
 >
 <div className="space-y-5">
 <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/50 rounded-md">
 <selectedEvent.icon className="size-6" style={{ color: selectedEvent.color }} />
 <div>
 <div className="text-[13px] font-semibold text-foreground">Source: {selectedEvent.source}</div>
 <div className="text-[12px] text-muted-foreground">{selectedEvent.details}</div>
 </div>
 </div>

 <div className="space-y-2">
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Event Metadata</div>
 <div className="p-3 bg-muted/30 border border-border/50 rounded-md space-y-3">
 <div className="flex justify-between items-center text-[13px]">
 <span className="text-muted-foreground">Event ID</span>
 <span className="font-mono text-[11px] text-foreground bg-muted px-1.5 py-0.5 rounded">evt_{selectedEvent.id}_992</span>
 </div>
 <div className="flex justify-between items-center text-[13px]">
 <span className="text-muted-foreground">Timestamp</span>
 <span className="font-medium text-foreground">Today, {selectedEvent.time}</span>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Raw JSON Payload</div>
 <div className="bg-[#1e1e1e] rounded-md p-3 overflow-x-auto">
 <pre className="text-[11px] font-mono text-[#d4d4d4] leading-relaxed">
{`{
 "event": "${selectedEvent.source.toLowerCase()}_event",
 "id": "evt_${selectedEvent.id}_992",
 "timestamp": "2026-07-25T${selectedEvent.time}",
 "data": {
 "action": "${selectedEvent.title}",
 "description": "${selectedEvent.details}"
 }
}`}
 </pre>
 </div>
 </div>
 </div>
 </RealityFabricInspector>
 ) : null
 }
 >
 <div className="max-w-3xl mx-auto py-6">
 {/* Filters */}
 <div className="flex items-center gap-2 mb-8 flex-wrap">
 <span className="text-[12px] font-semibold text-muted-foreground/70 mr-2 uppercase tracking-wider">Filters:</span>
 {["All", "GitHub", "Slack", "API", "Mission", "Institution"].map(filter => (
 <button 
 key={filter}
 className={cn(
 "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border",
 filter === "All" ? "bg-black text-white border-black" : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground/80"
 )}
 >
 {filter}
 </button>
 ))}
 </div>

 {/* Timeline */}
 <div className="relative pl-6">
 {/* Vertical Line */}
 <div className="absolute left-[35px] top-4 bottom-4 w-px bg-muted/80" />

 <div className="space-y-6">
 {EVENTS.map((event, i) => (
 <div key={event.id} className="relative flex items-start gap-6 group">
 <div className="text-[12px] font-medium text-muted-foreground/70 w-12 text-right pt-2 shrink-0">
 {event.time}
 </div>
 
 <div 
 className={cn(
 "relative z-10 size-6 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 border-white ring-1 ring-black/5",
 "bg-card transition-transform group-hover:scale-110"
 )}
 style={{ color: event.color }}
 >
 <event.icon className="size-3.5" />
 </div>

 <div 
 onClick={() => setSelectedId(event.id)}
 className={cn(
 "flex-1 bg-card border rounded-md p-6 cursor-pointer transition-all hover: hover:-translate-y-0.5",
 selectedId === event.id ? "border-black ring-1 ring-black/5" : "border-border "
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <h3 className="text-[14px] font-semibold text-foreground">{event.title}</h3>
 <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
 {event.source}
 </span>
 </div>
 <p className="text-[13px] text-muted-foreground">{event.details}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </RealityFabricShell>
 );
}


